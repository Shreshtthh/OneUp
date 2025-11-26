import { SuiClient } from '@onelabs/sui/client';
import { Transaction } from '@onelabs/sui/transactions';
import { decodeSuiPrivateKey } from '@onelabs/sui/cryptography';
import { Ed25519Keypair } from '@onelabs/sui/keypairs/ed25519';
import dotenv from 'dotenv';

dotenv.config();

interface ActiveDuel {
  duelId: string;
  creator: string;
  opponent: string;
  startTime: number;
  duration: number;
  creatorStartBalance: bigint;
  opponentStartBalance: bigint;
}

class Referee {
  private client: SuiClient;
  private adminKeypair: Ed25519Keypair;
  private activeDuels = new Map<string, ActiveDuel>();
  private processedEvents = new Set<string>();
  
  constructor() {
    this.client = new SuiClient({
      url: 'https://rpc-testnet.onelabs.cc:443'
    });
    
    // Decode the suiprivkey format
    const privateKeyString = process.env.ADMIN_PRIVATE_KEY!;
    const { schema, secretKey } = decodeSuiPrivateKey(privateKeyString);
    this.adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    
    console.log('🤖 Referee initialized');
    console.log('📍 Admin address:', this.adminKeypair.toSuiAddress());
  }
  
  async start() {
    console.log('🏟️  Starting Colosseum Referee...\n');
    
    setInterval(() => this.pollForNewDuels(), 5000);
    setInterval(() => this.checkExpiredDuels(), 10000);
    
    console.log('✅ Referee service running\n');
  }
  
  private async pollForNewDuels() {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${process.env.PACKAGE_ID}::duel::DuelJoined`
        },
        limit: 50,
        order: 'descending'
      });
      
      for (const event of events.data) {
        const eventId = event.id.txDigest + event.id.eventSeq;
        
        if (this.processedEvents.has(eventId)) continue;
        
        const parsed = event.parsedJson as any;
        const duel_id = parsed.duel_id;
        
        if (this.activeDuels.has(duel_id)) {
          this.processedEvents.add(eventId);
          continue;
        }
        
        console.log(`\n📋 New duel: ${duel_id.slice(0, 10)}...`);
        
        const [creatorStart, opponentStart] = await Promise.all([
          this.getPortfolioValue(parsed.creator),
          this.getPortfolioValue(parsed.opponent)
        ]);
        
        console.log(`   Creator: ${this.formatBalance(creatorStart)} OCT`);
        console.log(`   Opponent: ${this.formatBalance(opponentStart)} OCT`);
        
        this.activeDuels.set(duel_id, {
          duelId: duel_id,
          creator: parsed.creator,
          opponent: parsed.opponent,
          startTime: Number(parsed.start_time),
          duration: Number(parsed.duration),
          creatorStartBalance: creatorStart,
          opponentStartBalance: opponentStart
        });
        
        this.processedEvents.add(eventId);
      }
    } catch (error) {
      console.error('Error polling:', error);
    }
  }
  
  private async checkExpiredDuels() {
    const now = Date.now();
    
    for (const [duelId, duel] of this.activeDuels) {
      if (now >= duel.startTime + duel.duration) {
        console.log(`\n⏰ Resolving ${duelId.slice(0, 10)}...`);
        
        try {
          const [creatorEnd, opponentEnd] = await Promise.all([
            this.getPortfolioValue(duel.creator),
            this.getPortfolioValue(duel.opponent)
          ]);
          
          await this.resolveDuel(
            duelId,
            duel.creatorStartBalance,
            creatorEnd,
            duel.opponentStartBalance,
            opponentEnd
          );
          
          this.activeDuels.delete(duelId);
        } catch (error) {
          console.error('Resolution failed:', error);
        }
      }
    }
  }
  
  private async getPortfolioValue(address: string): Promise<bigint> {
    const coins = await this.client.getAllCoins({ owner: address });
    return coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
  }
  
  private formatBalance(balance: bigint): string {
    return (Number(balance) / 1_000_000_000).toFixed(4);
  }
  
  private async resolveDuel(
    duelId: string,
    creatorStart: bigint,
    creatorEnd: bigint,
    opponentStart: bigint,
    opponentEnd: bigint
  ) {
    const tx = new Transaction();
    
    tx.moveCall({
      target: `${process.env.PACKAGE_ID}::duel::resolve`,
      arguments: [
        tx.object(process.env.ADMIN_CAP_ID!),
        tx.object(duelId),
        tx.pure.u64(creatorStart.toString()),
        tx.pure.u64(creatorEnd.toString()),
        tx.pure.u64(opponentStart.toString()),
        tx.pure.u64(opponentEnd.toString()),
        tx.object('0x6')
      ],
      typeArguments: ['0x2::oct::OCT']
    });
    
    const result = await this.client.signAndExecuteTransaction({
      transaction: tx,
      signer: this.adminKeypair,
      options: { showEffects: true, showEvents: true }
    });
    
    console.log(`   ✅ Resolved: ${result.digest.slice(0, 10)}...`);
  }
}

const referee = new Referee();
referee.start();
