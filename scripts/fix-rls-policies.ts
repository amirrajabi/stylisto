import { supabase } from '../lib/supabase';

export async function fixRLSPolicies() {
  try {
    console.log('🔧 Starting RLS policy fixes...');

    const updates = [
      // Drop and recreate the update policy for saved_outfits to allow soft delete
      `DROP POLICY IF EXISTS "Users can update own saved outfits" ON saved_outfits;`,

      `CREATE POLICY "Users can update own saved outfits"
        ON saved_outfits
        FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);`,

      // Also ensure the select policy includes deleted items for the user to manage them
      `DROP POLICY IF EXISTS "Users can read own saved outfits" ON saved_outfits;`,

      `CREATE POLICY "Users can read own saved outfits"
        ON saved_outfits
        FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);`,

      // Update outfit_items policy to work with soft deleted outfits
      `DROP POLICY IF EXISTS "Users can read own outfit items" ON outfit_items;`,

      `CREATE POLICY "Users can read own outfit items"
        ON outfit_items
        FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM saved_outfits so 
            WHERE so.id = outfit_items.outfit_id 
            AND so.user_id = auth.uid()
          )
        );`,
    ];

    for (const sql of updates) {
      console.log('📝 Executing:', sql.substring(0, 50) + '...');
      const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
      if (error) {
        console.error('❌ Error executing SQL:', error);
        console.error('SQL was:', sql);
      } else {
        console.log('✅ SQL executed successfully');
      }
    }

    console.log('🎉 RLS policy fixes completed!');
  } catch (error) {
    console.error('❌ Error fixing RLS policies:', error);
    throw error;
  }
}

// Run immediately if called directly
if (require.main === module) {
  fixRLSPolicies()
    .then(() => {
      console.log('✅ All done!');
      process.exit(0);
    })
    .catch(error => {
      console.error('❌ Failed:', error);
      process.exit(1);
    });
}
