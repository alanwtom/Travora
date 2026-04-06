import { supabase } from '@/lib/supabase';
import type { Database, Json } from '@/types/database';
import type { FlightData } from '@/types/travel';
import type { SerpApiHotelOption } from '@/services/serpapiHotels';

export type ItineraryFlightPinRow = Database['public']['Tables']['itinerary_flight_pins']['Row'];
export type ItineraryHotelPinRow = Database['public']['Tables']['itinerary_hotel_pins']['Row'];

/** Stored on `itineraries.metadata` when pin tables are not migrated yet */
const META_FLIGHT_PINS = '_travora_flight_pins';
const META_HOTEL_PINS = '_travora_hotel_pins';

export type FlightPinSearchContext = {
  origin: string;
  destination: string;
  date: string;
};

export type HotelPinSearchContext = {
  query: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  rooms: number;
};

function getSupabaseMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (
    err &&
    typeof err === 'object' &&
    'message' in err &&
    typeof (err as { message: unknown }).message === 'string'
  ) {
    return (err as { message: string }).message;
  }
  return '';
}

function isFlightPinsTableUnavailable(err: unknown): boolean {
  const msg = getSupabaseMessage(err);
  return (
    msg.includes('itinerary_flight_pins') &&
    (msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('Could not find'))
  );
}

function isHotelPinsTableUnavailable(err: unknown): boolean {
  const msg = getSupabaseMessage(err);
  return (
    msg.includes('itinerary_hotel_pins') &&
    (msg.includes('schema cache') || msg.includes('does not exist') || msg.includes('Could not find'))
  );
}

function newPinId(): string {
  const c = typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `pin-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function asRecordMeta(metadata: unknown): Record<string, unknown> {
  if (metadata !== null && metadata !== undefined && typeof metadata === 'object' && !Array.isArray(metadata)) {
    return { ...(metadata as Record<string, unknown>) };
  }
  return {};
}

async function loadMetadataFlightPins(itineraryId: string): Promise<ItineraryFlightPinRow[]> {
  const { data, error } = await supabase.from('itineraries').select('metadata').eq('id', itineraryId).single();
  if (error) throw error;
  const raw = asRecordMeta(data?.metadata)[META_FLIGHT_PINS];
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object') as ItineraryFlightPinRow[];
}

async function loadMetadataHotelPins(itineraryId: string): Promise<ItineraryHotelPinRow[]> {
  const { data, error } = await supabase.from('itineraries').select('metadata').eq('id', itineraryId).single();
  if (error) throw error;
  const raw = asRecordMeta(data?.metadata)[META_HOTEL_PINS];
  if (!Array.isArray(raw)) return [];
  return raw.filter((x) => x && typeof x === 'object') as ItineraryHotelPinRow[];
}

async function appendFlightPinMetadata(
  itineraryId: string,
  userId: string,
  flight: FlightData,
  searchContext: FlightPinSearchContext
): Promise<ItineraryFlightPinRow> {
  const { data: row, error: fetchErr } = await supabase
    .from('itineraries')
    .select('metadata')
    .eq('id', itineraryId)
    .single();
  if (fetchErr) throw fetchErr;

  const meta = asRecordMeta(row?.metadata);
  const existing = Array.isArray(meta[META_FLIGHT_PINS]) ? [...(meta[META_FLIGHT_PINS] as unknown[])] : [];

  const pin: ItineraryFlightPinRow = {
    id: newPinId(),
    itinerary_id: itineraryId,
    user_id: userId,
    flight: JSON.parse(JSON.stringify(flight)) as Json,
    search_context: JSON.parse(JSON.stringify(searchContext)) as Json,
    created_at: new Date().toISOString(),
  };
  meta[META_FLIGHT_PINS] = [...existing, pin];

  const { error: upErr } = await supabase
    .from('itineraries')
    .update({ metadata: meta as Json })
    .eq('id', itineraryId);
  if (upErr) throw upErr;
  return pin;
}

async function appendHotelPinMetadata(
  itineraryId: string,
  userId: string,
  hotel: SerpApiHotelOption,
  searchContext: HotelPinSearchContext
): Promise<ItineraryHotelPinRow> {
  const { data: row, error: fetchErr } = await supabase
    .from('itineraries')
    .select('metadata')
    .eq('id', itineraryId)
    .single();
  if (fetchErr) throw fetchErr;

  const meta = asRecordMeta(row?.metadata);
  const existing = Array.isArray(meta[META_HOTEL_PINS]) ? [...(meta[META_HOTEL_PINS] as unknown[])] : [];

  const pin: ItineraryHotelPinRow = {
    id: newPinId(),
    itinerary_id: itineraryId,
    user_id: userId,
    hotel: JSON.parse(JSON.stringify(hotel)) as Json,
    search_context: JSON.parse(JSON.stringify(searchContext)) as Json,
    created_at: new Date().toISOString(),
  };
  meta[META_HOTEL_PINS] = [...existing, pin];

  const { error: upErr } = await supabase
    .from('itineraries')
    .update({ metadata: meta as Json })
    .eq('id', itineraryId);
  if (upErr) throw upErr;
  return pin;
}

async function removeFlightPinFromMetadata(itineraryId: string, pinId: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from('itineraries')
    .select('metadata')
    .eq('id', itineraryId)
    .single();
  if (fetchErr) throw fetchErr;

  const meta = asRecordMeta(row?.metadata);
  const raw = meta[META_FLIGHT_PINS];
  if (!Array.isArray(raw)) return;

  const next = raw.filter((p) => {
    if (!p || typeof p !== 'object') return true;
    return (p as { id?: string }).id !== pinId;
  });
  if (next.length === raw.length) return;

  meta[META_FLIGHT_PINS] = next;
  const { error: upErr } = await supabase
    .from('itineraries')
    .update({ metadata: meta as Json })
    .eq('id', itineraryId);
  if (upErr) throw upErr;
}

async function removeHotelPinFromMetadata(itineraryId: string, pinId: string): Promise<void> {
  const { data: row, error: fetchErr } = await supabase
    .from('itineraries')
    .select('metadata')
    .eq('id', itineraryId)
    .single();
  if (fetchErr) throw fetchErr;

  const meta = asRecordMeta(row?.metadata);
  const raw = meta[META_HOTEL_PINS];
  if (!Array.isArray(raw)) return;

  const next = raw.filter((p) => {
    if (!p || typeof p !== 'object') return true;
    return (p as { id?: string }).id !== pinId;
  });
  if (next.length === raw.length) return;

  meta[META_HOTEL_PINS] = next;
  const { error: upErr } = await supabase
    .from('itineraries')
    .update({ metadata: meta as Json })
    .eq('id', itineraryId);
  if (upErr) throw upErr;
}

function mergePinsById<T extends { id: string; created_at: string }>(a: T[], b: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of b) byId.set(r.id, r);
  for (const r of a) byId.set(r.id, r);
  return Array.from(byId.values()).sort((x, y) => y.created_at.localeCompare(x.created_at));
}

function asFlightData(json: unknown): FlightData {
  return json as FlightData;
}

function asHotelOption(json: unknown): SerpApiHotelOption {
  return json as SerpApiHotelOption;
}

export async function listFlightPinsForItinerary(itineraryId: string): Promise<ItineraryFlightPinRow[]> {
  const { data, error } = await supabase
    .from('itinerary_flight_pins')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false });

  if (error && isFlightPinsTableUnavailable(error)) {
    const meta = await loadMetadataFlightPins(itineraryId);
    return meta.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  if (error) throw error;

  const tableRows = data ?? [];
  let metaRows: ItineraryFlightPinRow[] = [];
  try {
    metaRows = await loadMetadataFlightPins(itineraryId);
  } catch {
    // metadata read failed; table pins still valid
  }
  if (metaRows.length === 0) return tableRows;
  return mergePinsById(tableRows, metaRows);
}

export async function listHotelPinsForItinerary(itineraryId: string): Promise<ItineraryHotelPinRow[]> {
  const { data, error } = await supabase
    .from('itinerary_hotel_pins')
    .select('*')
    .eq('itinerary_id', itineraryId)
    .order('created_at', { ascending: false });

  if (error && isHotelPinsTableUnavailable(error)) {
    const meta = await loadMetadataHotelPins(itineraryId);
    return meta.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  if (error) throw error;

  const tableRows = data ?? [];
  let metaRows: ItineraryHotelPinRow[] = [];
  try {
    metaRows = await loadMetadataHotelPins(itineraryId);
  } catch {
    // ignore
  }
  if (metaRows.length === 0) return tableRows;
  return mergePinsById(tableRows, metaRows);
}

export async function addFlightPin(
  itineraryId: string,
  userId: string,
  flight: FlightData,
  searchContext: FlightPinSearchContext
): Promise<ItineraryFlightPinRow> {
  const { data, error } = await supabase
    .from('itinerary_flight_pins')
    .insert({
      itinerary_id: itineraryId,
      user_id: userId,
      flight: JSON.parse(JSON.stringify(flight)) as Json,
      search_context: JSON.parse(JSON.stringify(searchContext)) as Json,
    })
    .select('*')
    .single();

  if (!error && data) return data;
  if (error && isFlightPinsTableUnavailable(error)) {
    return appendFlightPinMetadata(itineraryId, userId, flight, searchContext);
  }
  if (error) throw error;
  throw new Error('Failed to save flight pin');
}

export async function addHotelPin(
  itineraryId: string,
  userId: string,
  hotel: SerpApiHotelOption,
  searchContext: HotelPinSearchContext
): Promise<ItineraryHotelPinRow> {
  const { data, error } = await supabase
    .from('itinerary_hotel_pins')
    .insert({
      itinerary_id: itineraryId,
      user_id: userId,
      hotel: JSON.parse(JSON.stringify(hotel)) as Json,
      search_context: JSON.parse(JSON.stringify(searchContext)) as Json,
    })
    .select('*')
    .single();

  if (!error && data) return data;
  if (error && isHotelPinsTableUnavailable(error)) {
    return appendHotelPinMetadata(itineraryId, userId, hotel, searchContext);
  }
  if (error) throw error;
  throw new Error('Failed to save hotel pin');
}

export async function deleteFlightPin(pinId: string, itineraryId: string): Promise<void> {
  const { error: delErr } = await supabase.from('itinerary_flight_pins').delete().eq('id', pinId);
  if (delErr && !isFlightPinsTableUnavailable(delErr)) throw delErr;

  await removeFlightPinFromMetadata(itineraryId, pinId);
}

export async function deleteHotelPin(pinId: string, itineraryId: string): Promise<void> {
  const { error: delErr } = await supabase.from('itinerary_hotel_pins').delete().eq('id', pinId);
  if (delErr && !isHotelPinsTableUnavailable(delErr)) throw delErr;

  await removeHotelPinFromMetadata(itineraryId, pinId);
}

export { asFlightData, asHotelOption };
