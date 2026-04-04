export const dynamic = 'force-dynamic';
/**
 * /api/workers  –  Worker CRUD
 *
 * GET:  List all workers with their zone context.
 * POST: Create or upsert a worker record. Validates fields via WorkerUpsertSchema.
 */
import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

import { supabaseServer } from '@/lib/supabaseServer';
import { WorkerUpsertSchema } from '@/lib/engineValidators';

export async function GET(): Promise<NextResponse> {
  try {
    // Join zones via zone_id foreign key using Supabase implicit join syntax
    const { data, error } = await supabaseServer
      .from('workers')
      .select(
        `id, name, platform, vehicle_type, created_at,
         zone_id,
         zones:zone_id ( id, name, city, zri )`
      )
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const rawBody = await request.json();
    const input = WorkerUpsertSchema.parse(rawBody);

    const { data, error } = await supabaseServer
      .from('workers')
      .upsert(input, { onConflict: 'id' })
      .select(
        `id, name, platform, vehicle_type, created_at,
         zone_id,
         zones:zone_id ( id, name, city, zri )`
      )
      .single();

    if (error) throw new Error(error.message);

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: unknown) {
    const isZod = err instanceof ZodError;
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { success: false, error: isZod ? 'Validation failed' : message, details: isZod ? err.issues : undefined },
      { status: isZod ? 400 : 500 }
    );
  }
}
