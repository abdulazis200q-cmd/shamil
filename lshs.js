// Конфигурация Supabase (исправлен URL – без /rest/v1/)
const SUPABASE_URL = 'https://jieuxizezjvtshkjfgjp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImppZXV4aXplemp2dHNoa2pmZ2pwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyMTY0OTksImV4cCI6MjA5Mjc5MjQ5OX0.eo8m99Is0j3HkoK0b9wrD_JQqjVml4RupEezrV-67o0';

const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

class AcademicService {
    async getAllStudents() {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        return data;
    }

    async createStudent(name, grade) {
        const { data, error } = await supabase
            .from('students')
            .insert([{ full_name: name, grade: parseInt(grade) }]);
        if (error) throw new Error(error.message);
        return data;
    }

    async deleteStudent(id) {
        const { error } = await supabase
            .from('students')
            .delete()
            .eq('id', id);
        if (error) throw new Error(error.message);
    }
}

const api = new AcademicService();

// DOM элементы
const studentList = document.getElementById('studentList');
const studentForm = document.getElementById('studentForm');
const searchInput = document.getElementById('studentSearch');
const countAllSpan = document.getElementById('countAll');
const avgGradeSpan = document.getElementById('avgGrade');
const studentsView = document.getElementById('studentsView');
const analyticsView = document.getElementById('analyticsView');
const navButtons = document.querySelectorAll('.nav-item');

let allStudents = [];

// Функция отрисовки таблицы с учётом поиска
function renderStudents() {
    const searchTerm = searchInput.value.toLowerCase();
    const filtered = allStudents.filter(s => 
        s.full_name.toLowerCase().includes(searchTerm)
    );
    
    if (studentList) {
        studentList.innerHTML = filtered.map(student => `
            <tr>
                <td>${student.id}</td>
                <td>${escapeHtml(student.full_name)}</td>
                <td>${student.grade}</td>
                <td><button class="delete-btn" data-id="${student.id}">Удалить</button></td>
            </tr>
        `).join('');
        
        // Навешиваем обработчики на новые кнопки удаления
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const id = parseInt(btn.dataset.id);
                await api.deleteStudent(id);
                loadStudents();
            });
        });
    }
    
    // Обновляем статистику по всем студентам (не по отфильтрованным)
    const total = allStudents.length;
    const avg = total > 0 ? (allStudents.reduce((sum, s) => sum + s.grade, 0) / total).toFixed(1) : '0.0';
    countAllSpan.textContent = total;
    avgGradeSpan.textContent = avg;
    
    // Если активна аналитика – обновить график
    if (analyticsView.style.display !== 'none') {
        renderAnalytics();
    }
}

// Простая защита от XSS
function escapeHtml(str) {
    return str.replace(/[&<>]/g, function(m) {
        if (m === '&') return '&amp;';
        if (m === '<') return '&lt;';
        if (m === '>') return '&gt;';
        return m;
    });
}

// Загрузка студентов из БД
async function loadStudents() {
    try {
        allStudents = await api.getAllStudents();
        renderStudents();
        document.getElementById('dbStatus').textContent = 'Supabase ✅';
    } catch (err) {
        console.error(err);
        document.getElementById('dbStatus').textContent = 'Ошибка';
        alert('Не удалось загрузить студентов: ' + err.message);
    }
}

// Отображение аналитики (гистограмма оценок)
function renderAnalytics() {
    const canvas = document.getElementById('gradeChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const grades = [1,2,3,4,5];
    const counts = grades.map(g => allStudents.filter(s => s.grade === g).length);
    
    // Простой canvas-график
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);
    const maxCount = Math.max(...counts, 1);
    const barWidth = w / (grades.length * 1.5);
    for (let i = 0; i < grades.length; i++) {
        const barHeight = (counts[i] / maxCount) * (h - 40);
        ctx.fillStyle = '#6366f1';
        ctx.fillRect(i * barWidth * 1.2 + 30, h - barHeight - 20, barWidth, barHeight);
        ctx.fillStyle = '#1e293b';
        ctx.fillText(grades[i], i * barWidth * 1.2 + 35, h - 5);
        ctx.fillText(counts[i], i * barWidth * 1.2 + 35, h - barHeight - 25);
    }
    ctx.fillStyle = '#475569';
    ctx.fillText('Оценка', w/2, h-5);
    ctx.fillText('Кол-во студентов', 10, 20);
}

// Обработчик добавления
studentForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nameInput = document.getElementById('name');
    const gradeInput = document.getElementById('grade');
    const name = nameInput.value.trim();
    const grade = parseInt(gradeInput.value);
    
    if (!name || isNaN(grade) || grade < 1 || grade > 5) {
        alert('Введите корректное имя и оценку (1-5)');
        return;
    }
    
    try {
        await api.createStudent(name, grade);
        nameInput.value = '';
        gradeInput.value = '';
        await loadStudents();
    } catch (err) {
        alert('Ошибка добавления: ' + err.message);
    }
});

// Поиск
searchInput.addEventListener('input', () => renderStudents());

// Переключение вкладок
navButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        navButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        if (view === 'students') {
            studentsView.style.display = 'block';
            analyticsView.style.display = 'none';
        } else {
            studentsView.style.display = 'none';
            analyticsView.style.display = 'block';
            renderAnalytics();
        }
    });
});

// Запуск
loadStudents();