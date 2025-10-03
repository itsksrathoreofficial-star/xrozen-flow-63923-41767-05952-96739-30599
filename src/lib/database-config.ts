/**
 * Universal Database Abstraction Layer
 * Provides a unified interface for database operations
 */

// Lazy import to avoid initialization issues
let supabaseClient: any = null;
const getSupabase = async () => {
  if (!supabaseClient) {
    const { supabase } = await import("@/integrations/supabase/client");
    supabaseClient = supabase;
  }
  return supabaseClient;
};

export type DatabaseProvider = 'supabase' | 'firebase' | 'mysql' | 'postgresql' | 'mongodb' | 'sqlite';

export type QueryOperation = 'select' | 'insert' | 'update' | 'delete' | 'count';

export interface DatabaseConfig {
  provider: DatabaseProvider;
  credentials: any;
  isActive: boolean;
}

export interface UniversalQuery {
  collection: string;
  operation: QueryOperation;
  data?: any;
  where?: any;
  orderBy?: { column: string; ascending: boolean };
  limit?: number;
  select?: string;
}

interface DatabaseAdapter {
  query(query: UniversalQuery): Promise<any>;
  testConnection(): Promise<boolean>;
  migrate(data: any[]): Promise<void>;
}

class SupabaseAdapter implements DatabaseAdapter {
  async query(query: UniversalQuery): Promise<any> {
    const supabase = await getSupabase();
    const { collection, operation, data, where, orderBy, limit, select } = query;
    
    switch (operation) {
      case 'select':
        let selectQuery = (supabase as any).from(collection).select(select || '*');
        
        if (where) {
          Object.entries(where).forEach(([key, value]) => {
            selectQuery = selectQuery.eq(key, value);
          });
        }
        
        if (orderBy) {
          selectQuery = selectQuery.order(orderBy.column, { 
            ascending: orderBy.ascending 
          });
        }
        
        if (limit) {
          selectQuery = selectQuery.limit(limit);
        }
        
        const { data: selectData, error: selectError } = await selectQuery;
        if (selectError) throw selectError;
        return selectData;
      
      case 'insert':
        const supabase1 = await getSupabase();
        const { data: insertData, error: insertError } = await (supabase1 as any)
          .from(collection)
          .insert(data)
          .select();
        if (insertError) throw insertError;
        return insertData?.[0];
      
      case 'update':
        if (!where) throw new Error('Update requires where clause');
        
        const supabase2 = await getSupabase();
        let updateQuery = (supabase2 as any).from(collection).update(data);
        Object.entries(where).forEach(([key, value]) => {
          updateQuery = updateQuery.eq(key, value);
        });
        
        const { data: updateData, error: updateError } = await updateQuery.select();
        if (updateError) throw updateError;
        return updateData?.[0];
      
      case 'delete':
        if (!where) throw new Error('Delete requires where clause');
        
        const supabase3 = await getSupabase();
        let deleteQuery = (supabase3 as any).from(collection).delete();
        Object.entries(where).forEach(([key, value]) => {
          deleteQuery = deleteQuery.eq(key, value);
        });
        
        const { error: deleteError } = await deleteQuery;
        if (deleteError) throw deleteError;
        return null;
      
      case 'count':
        const supabase4 = await getSupabase();
        const { count, error: countError } = await (supabase4 as any)
          .from(collection)
          .select('*', { count: 'exact', head: true });
        if (countError) throw countError;
        return count || 0;
      
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
  }
  
  async testConnection(): Promise<boolean> {
    try {
      const result = await this.query({
        collection: 'profiles',
        operation: 'select',
        select: 'id',
        limit: 1
      });
      return true;
    } catch {
      return false;
    }
  }
  
  async migrate(data: any[]): Promise<void> {
    // Migration logic would be implemented here
    console.log('Migration started with', data.length, 'records');
  }
}

class DatabaseManager {
  private currentAdapter: DatabaseAdapter;
  private currentProvider: DatabaseProvider = 'supabase';
  
  constructor() {
    this.currentAdapter = new SupabaseAdapter();
  }
  
  getCurrentProvider(): DatabaseProvider {
    return this.currentProvider;
  }
  
  async query(query: UniversalQuery): Promise<any> {
    return this.currentAdapter.query(query);
  }
  
  async testConnection(): Promise<boolean> {
    return this.currentAdapter.testConnection();
  }
  
  async switchProvider(
    provider: DatabaseProvider, 
    credentials: Record<string, any>
  ): Promise<void> {
    // In a full implementation, this would:
    // 1. Validate credentials
    // 2. Test connection to new provider
    // 3. Backup current data
    // 4. Migrate data to new provider
    // 5. Update active adapter
    
    console.log(`Switching to ${provider}...`);
    
    // Store config in database_config table
    await this.currentAdapter.query({
      collection: 'database_config',
      operation: 'insert',
      data: {
        provider,
        config: credentials,
        is_active: true
      }
    });
  }
  
  async getActiveConfig(): Promise<DatabaseConfig | null> {
    const result = await this.currentAdapter.query({
      collection: 'database_config',
      operation: 'select',
      where: { is_active: true },
      limit: 1
    });
    
    if (Array.isArray(result) && result.length > 0) {
      return {
        provider: result[0].provider,
        credentials: result[0].config,
        isActive: result[0].is_active
      };
    }
    
    return null;
  }
}

// Export singleton instance
export const db = new DatabaseManager();

// Helper functions for common operations
export const dbHelpers = {
  async getProfiles(userId?: string) {
    return db.query({
      collection: 'profiles',
      operation: 'select',
      where: userId ? { id: userId } : undefined
    });
  },
  
  async getProjects(editorId?: string) {
    return db.query({
      collection: 'projects',
      operation: 'select',
      where: editorId ? { editor_id: editorId } : undefined,
      orderBy: { column: 'created_at', ascending: false }
    });
  },
  
  async createProject(data: any) {
    return db.query({
      collection: 'projects',
      operation: 'insert',
      data
    });
  },
  
  async getMessages(projectId?: string) {
    return db.query({
      collection: 'messages',
      operation: 'select',
      where: projectId ? { project_id: projectId } : undefined,
      orderBy: { column: 'created_at', ascending: true }
    });
  },
  
  async createMessage(data: any) {
    return db.query({
      collection: 'messages',
      operation: 'insert',
      data
    });
  },
  
  async getPayments(userId?: string) {
    return db.query({
      collection: 'payments',
      operation: 'select',
      where: userId ? { payer_id: userId } : undefined,
      orderBy: { column: 'created_at', ascending: false }
    });
  },
  
  async getUserRole(userId: string) {
    const result = await db.query({
      collection: 'user_roles',
      operation: 'select',
      where: { user_id: userId },
      limit: 1
    });
    return result && result.length > 0 ? result[0].role : null;
  },
  
  async getEditors() {
    return db.query({
      collection: 'editors',
      operation: 'select',
      orderBy: { column: 'created_at', ascending: false }
    });
  },
  
  async getClients() {
    return db.query({
      collection: 'clients',
      operation: 'select',
      orderBy: { column: 'created_at', ascending: false }
    });
  }
};
