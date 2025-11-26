import { SuiClient } from '@onelabs/sui/client';
import { Transaction } from '@onelabs/sui/transactions';
import { decodeSuiPrivateKey } from '@onelabs/sui/cryptography';
import { Ed25519Keypair } from '@onelabs/sui/keypairs/ed25519';
import fs from 'fs';
import path from 'path';
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

interface PersistedState {
  duels: [string, any][];
  processedEvents: string[];
}

class Referee {
  private client: SuiClient;
  private adminKeypair: Ed25519Keypair;
  private activeDuels = new Map<string, ActiveDuel>();
  private processedEvents = new Set<string>();
  private readonly STATE_FILE = path.join(__dirname, 'duel_state.json');
  private readonly OCT_TYPE = '0x2::oct::OCT';
  
  constructor() {
    this.client = new SuiClient({
      url: 'https://rpc-testnet.onelabs.cc:443'
    });
    
    const privateKeyString = process.env.ADMIN_PRIVATE_KEY!;
    const { schema, secretKey } = decodeSuiPrivateKey(privateKeyString);
    this.adminKeypair = Ed25519Keypair.fromSecretKey(secretKey);
    
    console.log('🤖 Referee initialized');
    console.log('📍 Admin address:', this.adminKeypair.toSuiAddress());
    
    // ✅ NEW: Load persisted state on startup
    this.loadState();
  }
  
  // ✅ NEW: Persist state to survive restarts
  private loadState() {
    if (fs.existsSync(this.STATE_FILE)) {
      try {
        const data = fs.readFileSync(this.STATE_FILE, 'utf8');
        const state: PersistedState = JSON.parse(data);
        
        this.activeDuels = new Map(
          state.duels.map(([id, duel]) => [
            id,
            {
              ...duel,
              creatorStartBalance: BigInt(duel.creatorStartBalance),
              opponentStartBalance: BigInt(duel.opponentStartBalance)
            }
          ])
        );
        
        this.processedEvents = new Set(state.processedEvents);
        
        console.log(`✅ Restored ${this.activeDuels.size} active duels from disk`);
      } catch (error) {
        console.error('⚠️  Failed to load state:', error);
      }
    }
  }
  
  private saveState() {
    try {
      const state: PersistedState = {
        duels: Array.from(this.activeDuels.entries()).map(([id, duel]) => [
          id,
          {
            ...duel,
            creatorStartBalance: duel.creatorStartBalance.toString(),
            opponentStartBalance: duel.opponentStartBalance.toString()
          }
        ]),
        processedEvents: Array.from(this.processedEvents)
      };
      
      fs.writeFileSync(this.STATE_FILE, JSON.stringify(state, null, 2));
    } catch (error) {
      console.error('⚠️  Failed to save state:', error);
    }
  }
  
  async start() {
    console.log('🏟️  Starting Colosseum Referee...\n');
    
    // ✅ NEW: Recover active duels on startup
    await this.recoverActiveDuels();
    
    setInterval(() => this.pollForNewDuels(), 5000);
    setInterval(() => this.checkExpiredDuels(), 10000);
    setInterval(() => this.saveState(), 30000);
    
    console.log('✅ Referee service running\n');
  }
  
  // ✅ NEW: Query blockchain for active duels on startup
  private async recoverActiveDuels() {
    console.log('🔍 Checking for active duels on-chain...');
    
    try {
      // Query for all DuelJoined events we might have missed
      const events = await this.client.queryEvents({
        query: {
          MoveEventType: `${process.env.PACKAGE_ID}::duel::DuelJoined`
        },
        limit: 100,
        order: 'descending'
      });
      
      let recovered = 0;
      
      for (const event of events.data) {
        const parsed = event.parsedJson as any;
        const duel_id = parsed.duel_id;
        
        // Skip if we already know about this duel
        if (this.activeDuels.has(duel_id)) continue;
        
        // Check if duel is still active
        try {
          const duelObject = await this.client.getObject({
            id: duel_id,
            options: { showContent: true }
          });
          
          if (duelObject.data?.content?.dataType === 'moveObject') {
            const fields = (duelObject.data.content as any).fields;
            
            // Only recover if status is still Active (1)
            if (fields.status === 1) {
              const [creatorStart, opponentStart] = await Promise.all([
                this.getPortfolioValue(parsed.creator),
                this.getPortfolioValue(parsed.opponent)
              ]);
              
              this.activeDuels.set(duel_id, {
                duelId: duel_id,
                creator: parsed.creator,
                opponent: parsed.opponent,
                startTime: Number(parsed.start_time),
                duration: Number(parsed.duration),
                creatorStartBalance: creatorStart,
                opponentStartBalance: opponentStart
              });
              
              recovered++;
            }
          }
        } catch (err) {
          // Duel might be deleted or resolved, skip it
          continue;
        }
      }
      
      if (recovered > 0) {
        console.log(`✅ Recovered ${recovered} active duels\n`);
        this.saveState();
      } else {
        console.log('✅ No active duels to recover\n');
      }
    } catch (error) {
      console.error('⚠️  Error recovering duels:', error);
    }
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
        
        // ✅ FIX: Prevent overwriting snapshots on restart
        if (this.activeDuels.has(duel_id)) {
          this.processedEvents.add(eventId);
          continue;
        }
        
        console.log(`\n📋 New duel: ${duel_id.slice(0, 10)}...`);
        
        // ✅ FIX: Only get OCT balance (not all tokens)
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
        this.saveState();
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
          
          const creatorScore = (Number(creatorEnd) * 10000) / Number(duel.creatorStartBalance);
          const opponentScore = (Number(opponentEnd) * 10000) / Number(duel.opponentStartBalance);
          
          console.log(`   Creator: ${creatorScore.toFixed(0)} vs Opponent: ${opponentScore.toFixed(0)}`);
          
          await this.resolveDuel(
            duelId,
            duel.creatorStartBalance,
            creatorEnd,
            duel.opponentStartBalance,
            opponentEnd
          );
          
          this.activeDuels.delete(duelId);
          this.saveState();
        } catch (error) {
          console.error('Resolution failed:', error);
        }
      }
    }
  }
  
  // ✅ FIX: Only count OCT balance (not all tokens)
  private async getPortfolioValue(address: string): Promise<bigint> {
    try {
      const coins = await this.client.getCoins({
        owner: address,
        coinType: this.OCT_TYPE
      });
      
      return coins.data.reduce((sum, coin) => sum + BigInt(coin.balance), 0n);
    } catch (error) {
      console.error(`Error fetching OCT balance for ${address.slice(0, 8)}:`, error);
      return 0n;
    }
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
      tx.pure.address(this.adminKeypair.toSuiAddress()),  // ✅ NEW: Fee goes to admin
      tx.object('0x6')
    ],
    typeArguments: [this.OCT_TYPE]
  });
  
  const result = await this.client.signAndExecuteTransaction({
    transaction: tx,
    signer: this.adminKeypair,
    options: { showEffects: true, showEvents: true }
  });
  
  console.log(`   ✅ Resolved: ${result.digest.slice(0, 10)}...`);
  console.log(`   💰 2.5% platform fee sent to: ${this.adminKeypair.toSuiAddress().slice(0, 10)}...`);
}
}

const referee = new Referee();
referee.start();
