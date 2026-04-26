// Конфигурация (замени на свои данные из Supabase)
const SUPABASE_URL = 'https://jieuxizezjvtshkjfgjp.supabase.co/rest/v1/';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXV4aXplemp2dHNoa2pmZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTY0OTksImV4cCI6MjA5Mjc5MjQ5OX0.eo8m99Is0j3HkoK0b9wrD_JQqjVml4RupEezrV-67o0';

// Инициализация клиента
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class AcademicService {
    // Получение всех студентов из облака
    async getAllStudents() {
        const { data, error } = await _supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw new Error(error.message);
        return data;
    }

    // Добавление новой записи
    async createStudent(name, grade) {
        const { data, error } = await _supabase
            .from('students')
            .insert([{ full_name: name, grade: parseInt(grade) }]);
        
        if (error) throw new Error(error.message);
        return data;
    }

    // Удаление записи
    async deleteStudent(id) {
        const { error } = await _supabase
            .from('students')
            .delete()
            .eq('id', id);
        
        if (error) throw new Error(error.message);
    }
}