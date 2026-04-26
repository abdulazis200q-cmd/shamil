/**
 * Класс Студента - Модель данных
 */
class Student {
    constructor(id, name, grade) {
        this.id = id;
        this.name = name;
        this.grade = parseInt(grade);
        this.createdAt = new Date().toLocaleDateString();
    }

    get status() {
        return this.grade >= 4 ? 'Успешен' : 'Нужна помощь';
    }
}

/**
 * Сервис управления данными (Business Logic)
 */
class AcademicService {
    constructor() {
        this._students = this._loadFromStorage();
    }

    _loadFromStorage() {
        const data = localStorage.getItem('edu_data');
        return data ? JSON.parse(data).map(s => new Student(s.id, s.name, s.grade)) : [];
    }

    _save() {
        localStorage.setItem('edu_data', JSON.stringify(this._students));
    }

    addStudent(name, grade) {
        const newStudent = new Student(Date.now(), name, grade);
        this._students.push(newStudent);
        this._save();
        return newStudent;
    }

    removeStudent(id) {
        this._students = this._students.filter(s => s.id !== id);
        this._save();
    }

    getStats() {
        if (this._students.length === 0) return { avg: 0, count: 0 };
        const sum = this._students.reduce((acc, s) => acc + s.grade, 0);
        return {
            avg: (sum / this._students.length).toFixed(1),
            count: this._students.length
        };
    }

    search(query) {
        return this._students.filter(s => 
            s.name.toLowerCase().includes(query.toLowerCase())
        );
    }
}

/**
 * Контроллер UI - отвечает за отрисовку
 */
class UIEngine {
    constructor(service) {
        this.service = service;
        this.listContainer = document.getElementById('studentList');
        this.init();
    }

    init() {
        document.getElementById('studentForm').addEventListener('submit', (e) => this.handleSubmit(e));
        document.getElementById('studentSearch').addEventListener('input', (e) => this.handleSearch(e));
        this.refresh();
    }

    handleSubmit(e) {
        e.preventDefault();
        const name = document.getElementById('name').value;
        const grade = document.getElementById('grade').value;
        
        this.service.addStudent(name, grade);
        e.target.reset();
        this.refresh();
    }

    handleSearch(e) {
        const results = this.service.search(e.target.value);
        this.renderTable(results);
    }

    refresh() {
        const stats = this.service.getStats();
        document.getElementById('countAll').innerText = stats.count;
        document.getElementById('avgGrade').innerText = stats.avg;
        this.renderTable(this.service._students);
    }

    renderTable(data) {
        this.listContainer.innerHTML = data.map(s => `
            <tr>
                <td>#${String(s.id).slice(-4)}</td>
                <td><strong>${s.name}</strong></td>
                <td>${s.grade} / 5</td>
                <td><span class="status-badge ${s.grade >= 4 ? 'good' : 'bad'}">${s.status}</span></td>
                <td><button class="btn-del" onclick="appUI.deleteEntry(${s.id})">Удалить</button></td>
            </tr>
        `).join('');
    }

    deleteEntry(id) {
        if (confirm('Удалить студента из базы?')) {
            this.service.removeStudent(id);
            this.refresh();
        }
    }
}

// Запуск приложения
const academicService = new AcademicService();
const appUI = new UIEngine(academicService);