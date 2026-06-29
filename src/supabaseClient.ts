import { Subject, CalendarBlock, Grade } from './types';

// Fetch Supabase configuration from environment variables
const env = (import.meta as any).env || {};
const supabaseUrl = env.VITE_SUPABASE_URL || '';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient: any = null;

export function getSupabase() {
  if (supabaseClient) return supabaseClient;

  const supabaseLib = (window as any).supabase;
  if (!supabaseLib) {
    console.warn('Supabase CDN script is not loaded yet.');
    return null;
  }

  if (!supabaseUrl || !supabaseKey) {
    console.warn(
      'Supabase environment variables are missing. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.'
    );
    return null;
  }

  try {
    supabaseClient = supabaseLib.createClient(supabaseUrl, supabaseKey);
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

// Check if Supabase is fully configured and active
export function isSupabaseConfigured(): boolean {
  return !!getSupabase();
}

// ---------------- SUBJECTS TABLE API ----------------

export async function getSubjectsFromSupabase(): Promise<Subject[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('subjects')
      .select('*');

    if (error) throw error;
    return data as Subject[];
  } catch (err) {
    console.error('Error fetching subjects from Supabase:', err);
    throw err;
  }
}

export async function upsertSubjectInSupabase(subject: Subject): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('subjects')
      .upsert({
        id: subject.id,
        name: subject.name,
        colorClass: subject.colorClass,
        hexBg: subject.hexBg,
        hexBorder: subject.hexBorder,
        hexText: subject.hexText,
      });

    if (error) throw error;
  } catch (err) {
    console.error(`Error saving subject ${subject.id} to Supabase:`, err);
    throw err;
  }
}

export async function deleteSubjectFromSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('subjects')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error(`Error deleting subject ${id} from Supabase:`, err);
    throw err;
  }
}


// ---------------- EVENTS (CALENDAR BLOCKS) TABLE API ----------------

export async function getEventsFromSupabase(): Promise<CalendarBlock[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('events')
      .select('*');

    if (error) throw error;
    
    // Map database snake_case or different property structures to camelCase CalendarBlock
    return (data || []).map((item: any) => ({
      id: item.id,
      subjectId: item.subjectId || item.subject_id,
      title: item.title,
      day: item.day,
      startTime: item.startTime || item.start_time,
      endTime: item.endTime || item.end_time,
      room: item.room
    }));
  } catch (err) {
    console.error('Error fetching events from Supabase:', err);
    throw err;
  }
}

export async function upsertEventInSupabase(block: CalendarBlock): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('events')
      .upsert({
        id: block.id,
        subjectId: block.subjectId,
        title: block.title,
        day: block.day,
        startTime: block.startTime,
        endTime: block.endTime,
        room: block.room || null
      });

    if (error) throw error;
  } catch (err) {
    console.error(`Error saving event ${block.id} to Supabase:`, err);
    throw err;
  }
}

export async function deleteEventFromSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error(`Error deleting event ${id} from Supabase:`, err);
    throw err;
  }
}

export async function clearAllEventsFromSupabase(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('events')
      .delete()
      .neq('id', 'placeholder_force_all_delete'); // A clever way to delete all rows

    if (error) throw error;
  } catch (err) {
    console.error('Error clearing all events from Supabase:', err);
    throw err;
  }
}


// ---------------- GRADES TABLE API ----------------

export async function getGradesFromSupabase(): Promise<Grade[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('grades')
      .select('*');

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      subjectId: item.subjectId || item.subject_id,
      name: item.name,
      value: Number(item.value),
      weight: Number(item.weight),
      date: item.date
    }));
  } catch (err) {
    console.error('Error fetching grades from Supabase:', err);
    throw err;
  }
}

export async function upsertGradeInSupabase(grade: Grade): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('grades')
      .upsert({
        id: grade.id,
        subjectId: grade.subjectId,
        name: grade.name,
        value: grade.value,
        weight: grade.weight,
        date: grade.date
      });

    if (error) throw error;
  } catch (err) {
    console.error(`Error saving grade ${grade.id} to Supabase:`, err);
    throw err;
  }
}

export async function deleteGradeFromSupabase(id: string): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    const { error } = await supabase
      .from('grades')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (err) {
    console.error(`Error deleting grade ${id} from Supabase:`, err);
    throw err;
  }
}
