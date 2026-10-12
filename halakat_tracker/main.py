"""
نظام متابعة حلقات تحفيظ القرآن الكريم
تطبيق سطح مكتب مبني بـ Python و tkinter
"""
import tkinter as tk
from tkinter import ttk, messagebox, filedialog
from database import Database
from datetime import datetime
import random


class HalakatApp:
    def __init__(self, root):
        self.root = root
        self.root.title("نظام متابعة حلقات تحفيظ القرآن الكريم")
        self.root.geometry("1200x800")
        self.root.configure(bg="#f0f4f8")

        # تهيئة قاعدة البيانات
        self.db = Database()

        # إعداد الخطوط العربية
        self.font_title = ("Segoe UI", 16, "bold")
        self.font_header = ("Segoe UI", 12, "bold")
        self.font_normal = ("Segoe UI", 10)
        self.font_small = ("Segoe UI", 9)

        # إعداد الألوان
        self.colors = {
            "primary": "#2c3e50",
            "secondary": "#3498db",
            "success": "#27ae60",
            "warning": "#f39c12",
            "danger": "#e74c3c",
            "bg": "#f0f4f8",
            "card": "#ffffff",
            "text": "#2c3e50",
        }

        self.setup_styles()
        self.create_ui()

    def setup_styles(self):
        style = ttk.Style()
        style.theme_use("clam")
        style.configure("Title.TLabel", font=self.font_title, background="#f0f4f8", foreground="#2c3e50")
        style.configure("Card.TFrame", background="#ffffff", relief="solid", borderwidth=1)
        style.configure("Action.TButton", font=self.font_normal, padding=8)
        style.configure("Treeview.Heading", font=self.font_header, padding=6)
        style.configure("Treeview", font=self.font_normal, rowheight=30)

    def create_ui(self):
        # الشريط العلوي
        header = tk.Frame(self.root, bg="#2c3e50", height=60)
        header.pack(fill="x")
        header.pack_propagate(False)

        tk.Label(header, text="نظام متابعة حلقات تحفيظ القرآن الكريم",
                 font=self.font_title, bg="#2c3e50", fg="white").pack(side="right", padx=20, pady=15)

        tk.Label(header, text=f"تاريخ اليوم: {datetime.now().strftime('%Y-%m-%d')}",
                 font=self.font_normal, bg="#2c3e50", fg="#ecf0f1").pack(side="left", padx=20, pady=15)

        # شريط التنقل
        nav = tk.Frame(self.root, bg="#34495e", height=50)
        nav.pack(fill="x")
        nav.pack_propagate(False)

        nav_buttons = [
            ("الرئيسية", self.show_dashboard),
            ("الحلقات", self.show_circles),
            ("الطلاب", self.show_students),
            ("المدرسون", self.show_teachers),
            ("الأهداف الربعية", self.show_goals),
            ("التقييمات", self.show_evaluations),
            ("التقارير", self.show_reports),
        ]

        for text, command in nav_buttons:
            btn = tk.Button(nav, text=text, font=self.font_normal, bg="#34495e",
                           fg="white", activebackground="#2c3e50", activeforeground="white",
                           relief="flat", padx=15, pady=8, cursor="hand2", command=command)
            btn.pack(side="right", padx=2)

        # منطقة المحتوى الرئيسية
        self.content_frame = tk.Frame(self.root, bg="#f0f4f8")
        self.content_frame.pack(fill="both", expand=True, padx=10, pady=10)

        # عرض الصفحة الرئيسية افتراضياً
        self.show_dashboard()

    def clear_content(self):
        for widget in self.content_frame.winfo_children():
            widget.destroy()

    # ==================== الصفحة الرئيسية ====================
    def show_dashboard(self):
        self.clear_content()

        # بطاقات إحصائية
        stats = self.db.get_statistics()

        cards_frame = tk.Frame(self.content_frame, bg="#f0f4f8")
        cards_frame.pack(fill="x", pady=10)

        stat_cards = [
            ("عدد الحلقات", stats["total_circles"], "#3498db"),
            ("عدد الطلاب", stats["total_students"], "#27ae60"),
            ("عدد المدرسين", stats["total_teachers"], "#9b59b6"),
            ("متوسط الإنجاز", f"{stats['avg_completion']:.1f}%", "#f39c12"),
        ]

        for title, value, color in stat_cards:
            card = tk.Frame(cards_frame, bg="white", relief="solid", borderwidth=1,
                           padx=20, pady=15, width=200)
            card.pack(side="right", padx=10, expand=True)
            card.pack_propagate(False)
            tk.Label(card, text=title, font=self.font_normal, bg="white", fg="#7f8c8d").pack()
            tk.Label(card, text=str(value), font=("Segoe UI", 24, "bold"),
                    bg="white", fg=color).pack()

        # جدول آخر الحلقات
        tk.Label(self.content_frame, text="آخر الحلقات المضافة", font=self.font_header,
                bg="#f0f4f8", fg="#2c3e50").pack(anchor="ne", pady=10)

        columns = ("id", "name", "mosque", "teacher", "gender")
        tree = ttk.Treeview(self.content_frame, columns=columns, show="headings", height=10)

        tree.heading("id", text="م")
        tree.heading("name", text="اسم الحلقة")
        tree.heading("mosque", text="المسجد")
        tree.heading("teacher", text="المدرس")
        tree.heading("gender", text="النوع")

        tree.column("id", width=50, anchor="center")
        tree.column("name", width=200, anchor="center")
        tree.column("mosque", width=200, anchor="center")
        tree.column("teacher", width=200, anchor="center")
        tree.column("gender", width=100, anchor="center")

        # إضافة بيانات تجريبية أصلية من إنشائي
        circles = self.db.get_circles()[:10]
        for c in circles:
            teacher = self.db.get_teacher_by_id(c["teacher_id"])
            teacher_name = teacher["name"] if teacher else "غير محدد"
            tree.insert("", "end", values=(c["id"], c["name"], c["mosque"], teacher_name, c["gender"]))

        tree.pack(fill="both", expand=True, pady=5)

    # ==================== إدارة الحلقات ====================
    def show_circles(self):
        self.clear_content()

        toolbar = tk.Frame(self.content_frame, bg="#f0f4f8")
        toolbar.pack(fill="x", pady=5)

        tk.Button(toolbar, text="إضافة حلقة جديدة", font=self.font_normal,
                 bg="#27ae60", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.add_circle_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="تعديل الحلقة المحددة", font=self.font_normal,
                 bg="#3498db", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.edit_circle_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="حذف الحلقة المحددة", font=self.font_normal,
                 bg="#e74c3c", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.delete_circle).pack(side="right", padx=5)

        columns = ("id", "name", "mosque", "teacher", "gender", "students", "actions")
        tree = ttk.Treeview(self.content_frame, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["م", "اسم الحلقة", "المسجد", "المدرس", "النوع", "عدد الطلاب", "إجراءات"]):
            tree.heading(col, text=text)

        tree.column("id", width=40, anchor="center")
        tree.column("name", width=180)
        tree.column("mosque", width=180)
        tree.column("teacher", width=180)
        tree.column("gender", width=80, anchor="center")
        tree.column("students", width=80, anchor="center")
        tree.column("actions", width=100, anchor="center")

        circles = self.db.get_circles()
        for c in circles:
            teacher = self.db.get_teacher_by_id(c["teacher_id"])
            teacher_name = teacher["name"] if teacher else "غير محدد"
            students_count = len(self.db.get_students_by_circle(c["id"]))
            tree.insert("", "end", values=(c["id"], c["name"], c["mosque"],
                         teacher_name, c["gender"], students_count, "تعديل | حذف"))

        tree.pack(fill="both", expand=True, pady=10)

    def add_circle_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("إضافة حلقة جديدة")
        dialog.geometry("400x400")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="إضافة حلقة جديدة", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        # اسم الحلقة
        tk.Label(dialog, text="اسم الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        name_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        name_entry.pack(anchor="ne", padx=20, pady=2)

        # المسجد
        tk.Label(dialog, text="المسجد:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        mosque_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        mosque_entry.pack(anchor="ne", padx=20, pady=2)

        # المدرس
        tk.Label(dialog, text="المدرس:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        teachers = self.db.get_teachers()
        teacher_names = [t["name"] for t in teachers] if teachers else ["لا يوجد"]
        teacher_var = tk.StringVar(value=teacher_names[0] if teachers else "لا يوجد")
        teacher_combo = ttk.Combobox(dialog, textvariable=teacher_var, values=teacher_names, width=28, state="readonly")
        teacher_combo.pack(anchor="ne", padx=20, pady=2)

        # النوع
        tk.Label(dialog, text="النوع:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        gender_var = tk.StringVar(value="بنين")
        tk.Radiobutton(dialog, text="بنين", variable=gender_var, value="بنين",
                      font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        tk.Radiobutton(dialog, text="بنات", variable=gender_var, value="بنات",
                      font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        tk.Radiobutton(dialog, text="مختلط", variable=gender_var, value="مختلط",
                      font=self.font_normal, bg="white").pack(anchor="ne", padx=20)

        def save():
            name = name_entry.get().strip()
            mosque = mosque_entry.get().strip()
            if not name or not mosque:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحقول", parent=dialog)
                return

            teacher_id = None
            for t in teachers:
                if t["name"] == teacher_var.get():
                    teacher_id = t["id"]
                    break

            self.db.add_circle(name, mosque, teacher_id, gender_var.get())
            messagebox.showinfo("نجاح", "تم إضافة الحلقة بنجاح", parent=dialog)
            dialog.destroy()
            self.show_circles()

        tk.Button(dialog, text="حفظ", font=self.font_normal, bg="#27ae60",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def edit_circle_dialog(self):
        selected = self.content_frame.winfo_children()[-1].selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار حلقة للتعديل")
            return
        circle_id = int(self.content_frame.winfo_children()[-1].item(selected[0])["values"][0])
        circle = self.db.get_circle_by_id(circle_id)
        if not circle:
            return

        dialog = tk.Toplevel(self.root)
        dialog.title("تعديل الحلقة")
        dialog.geometry("400x400")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="تعديل بيانات الحلقة", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        tk.Label(dialog, text="اسم الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        name_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        name_entry.insert(0, circle["name"])
        name_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="المسجد:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        mosque_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        mosque_entry.insert(0, circle["mosque"])
        mosque_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="المدرس:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        teachers = self.db.get_teachers()
        teacher_names = [t["name"] for t in teachers] if teachers else ["لا يوجد"]
        teacher_var = tk.StringVar(value=teacher_names[0] if teachers else "لا يوجد")
        teacher_combo = ttk.Combobox(dialog, textvariable=teacher_var, values=teacher_names, width=28, state="readonly")
        teacher_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="النوع:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        gender_var = tk.StringVar(value=circle["gender"])
        tk.Radiobutton(dialog, text="بنين", variable=gender_var, value="بنين",
                      font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        tk.Radiobutton(dialog, text="بنات", variable=gender_var, value="بنات",
                      font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        tk.Radiobutton(dialog, text="مختلط", variable=gender_var, value="مختلط",
                      font=self.font_normal, bg="white").pack(anchor="ne", padx=20)

        def save():
            name = name_entry.get().strip()
            mosque = mosque_entry.get().strip()
            if not name or not mosque:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحقول", parent=dialog)
                return

            teacher_id = None
            for t in teachers:
                if t["name"] == teacher_var.get():
                    teacher_id = t["id"]
                    break

            self.db.update_circle(circle_id, name=name, mosque=mosque,
                                 teacher_id=teacher_id, gender=gender_var.get())
            messagebox.showinfo("نجاح", "تم تعديل الحلقة بنجاح", parent=dialog)
            dialog.destroy()
            self.show_circles()

        tk.Button(dialog, text="حفظ التعديلات", font=self.font_normal, bg="#3498db",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def delete_circle(self):
        tree = self.content_frame.winfo_children()[-1]
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار حلقة للحذف")
            return
        circle_id = int(tree.item(selected[0])["values"][0])
        if messagebox.askyesno("تأكيد الحذف", "هل أنت متأكد من حذف هذه الحلقة؟"):
            self.db.delete_circle(circle_id)
            messagebox.showinfo("نجاح", "تم حذف الحلقة بنجاح")
            self.show_circles()

    # ==================== إدارة الطلاب ====================
    def show_students(self):
        self.clear_content()

        toolbar = tk.Frame(self.content_frame, bg="#f0f4f8")
        toolbar.pack(fill="x", pady=5)

        tk.Button(toolbar, text="إضافة طالب جديد", font=self.font_normal,
                 bg="#27ae60", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.add_student_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="تعديل الطالب المحدد", font=self.font_normal,
                 bg="#3498db", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.edit_student_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="حذف الطالب المحدد", font=self.font_normal,
                 bg="#e74c3c", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.delete_student).pack(side="right", padx=5)

        # فلتر حسب الحلقة
        tk.Label(toolbar, text="فلتر حسب الحلقة:", font=self.font_normal,
                bg="#f0f4f8").pack(side="left", padx=5)
        circles = self.db.get_circles()
        circle_names = ["الكل"] + [c["name"] for c in circles]
        filter_var = tk.StringVar(value="الكل")
        filter_combo = ttk.Combobox(toolbar, textvariable=filter_var, values=circle_names,
                                    width=20, state="readonly")
        filter_combo.pack(side="left", padx=5)
        filter_combo.bind("<<ComboboxSelected>>", lambda e: self.refresh_students(tree, filter_var.get()))

        columns = ("id", "name", "circle", "surah", "last_juz", "start_surah")
        tree = ttk.Treeview(self.content_frame, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["م", "اسم الطالب", "الحلقة", "السورة", "آخر جزء", "بداية الخطة"]):
            tree.heading(col, text=text)

        tree.column("id", width=40, anchor="center")
        tree.column("name", width=200)
        tree.column("circle", width=180)
        tree.column("surah", width=100, anchor="center")
        tree.column("last_juz", width=80, anchor="center")
        tree.column("start_surah", width=120)

        self.refresh_students(tree, "الكل")
        tree.pack(fill="both", expand=True, pady=10)

    def refresh_students(self, tree, filter_name):
        for item in tree.get_children():
            tree.delete(item)

        students = self.db.get_students()
        for s in students:
            circle = self.db.get_circle_by_id(s["circle_id"])
            if filter_name == "الكل" or (circle and circle["name"] == filter_name):
                tree.insert("", "end", values=(s["id"], s["name"],
                             circle["name"] if circle else "غير محدد",
                             s["surah_name"], s["last_juz"], s["start_surah"]))

    def add_student_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("إضافة طالب جديد")
        dialog.geometry("500x500")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="إضافة طالب جديد", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        # اسم الطالب
        tk.Label(dialog, text="اسم الطالب:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        name_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        name_entry.pack(anchor="ne", padx=20, pady=2)

        # الحلقة
        tk.Label(dialog, text="الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        circles = self.db.get_circles()
        circle_names = [c["name"] for c in circles] if circles else ["لا يوجد"]
        circle_var = tk.StringVar(value=circle_names[0] if circles else "لا يوجد")
        circle_combo = ttk.Combobox(dialog, textvariable=circle_var, values=circle_names,
                                    width=32, state="readonly")
        circle_combo.pack(anchor="ne", padx=20, pady=2)

        # السورة
        tk.Label(dialog, text="السرة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        surah_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        surah_entry.pack(anchor="ne", padx=20, pady=2)

        # آخر جزء
        tk.Label(dialog, text="آخر جزء:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        juz_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        juz_entry.pack(anchor="ne", padx=20, pady=2)

        # بداية الخطة
        tk.Label(dialog, text="بداية الخطة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        start_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        start_entry.pack(anchor="ne", padx=20, pady=2)

        def save():
            name = name_entry.get().strip()
            surah = surah_entry.get().strip()
            juz = juz_entry.get().strip()
            start = start_entry.get().strip()
            if not name or not surah or not juz or not start:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحقول", parent=dialog)
                return

            circle_id = None
            for c in circles:
                if c["name"] == circle_var.get():
                    circle_id = c["id"]
                    break

            if circle_id is None:
                messagebox.showerror("خطأ", "يرجى إضافة حلقة أولاً", parent=dialog)
                return

            self.db.add_student(name, circle_id, surah, int(juz), start, start)
            messagebox.showinfo("نجاح", "تم إضافة الطالب بنجاح", parent=dialog)
            dialog.destroy()
            self.show_students()

        tk.Button(dialog, text="حفظ", font=self.font_normal, bg="#27ae60",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def edit_student_dialog(self):
        selected = self.content_frame.winfo_children()[-1].selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار طالب للتعديل")
            return
        student_id = int(self.content_frame.winfo_children()[-1].item(selected[0])["values"][0])
        student = self.db.get_student_by_id(student_id)
        if not student:
            return

        dialog = tk.Toplevel(self.root)
        dialog.title("تعديل بيانات الطالب")
        dialog.geometry("500x500")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="تعديل بيانات الطالب", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        tk.Label(dialog, text="اسم الطالب:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        name_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        name_entry.insert(0, student["name"])
        name_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        circles = self.db.get_circles()
        circle_names = [c["name"] for c in circles] if circles else ["لا يوجد"]
        circle_var = tk.StringVar(value=circle_names[0] if circles else "لا يوجد")
        circle_combo = ttk.Combobox(dialog, textvariable=circle_var, values=circle_names,
                                    width=32, state="readonly")
        circle_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="السورة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        surah_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        surah_entry.insert(0, student["surah_name"])
        surah_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="آخر جزء:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        juz_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        juz_entry.insert(0, str(student["last_juz"]))
        juz_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="بداية الخطة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        start_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        start_entry.insert(0, student["start_surah"])
        start_entry.pack(anchor="ne", padx=20, pady=2)

        def save():
            name = name_entry.get().strip()
            surah = surah_entry.get().strip()
            juz = juz_entry.get().strip()
            start = start_entry.get().strip()
            if not name or not surah or not juz or not start:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحقول", parent=dialog)
                return

            circle_id = None
            for c in circles:
                if c["name"] == circle_var.get():
                    circle_id = c["id"]
                    break

            if circle_id is None:
                messagebox.showerror("خطأ", "يرجى إضافة حلقة أولاً", parent=dialog)
                return

            self.db.update_student(student_id, name=name, circle_id=circle_id,
                                  surah_name=surah, last_juz=int(juz), start_surah=start)
            messagebox.showinfo("نجاح", "تم تعديل بيانات الطالب بنجاح", parent=dialog)
            dialog.destroy()
            self.show_students()

        tk.Button(dialog, text="حفظ التعديلات", font=self.font_normal, bg="#3498db",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def delete_student(self):
        tree = self.content_frame.winfo_children()[-1]
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار طالب للحذف")
            return
        student_id = int(tree.item(selected[0])["values"][0])
        if messagebox.askyesno("تأكيد الحذف", "هل أنت متأكد من حذف هذا الطالب؟"):
            self.db.delete_student(student_id)
            messagebox.showinfo("نجاح", "تم حذف الطالب بنجاح")
            self.show_students()

    # ==================== إدارة المدرسين ====================
    def show_teachers(self):
        self.clear_content()

        toolbar = tk.Frame(self.content_frame, bg="#f0f4f8")
        toolbar.pack(fill="x", pady=5)

        tk.Button(toolbar, text="إضافة مدرس جديد", font=self.font_normal,
                 bg="#27ae60", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.add_teacher_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="حذف المدرس المحدد", font=self.font_normal,
                 bg="#e74c3c", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.delete_teacher).pack(side="right", padx=5)

        columns = ("id", "name", "phone", "circles_count")
        tree = ttk.Treeview(self.content_frame, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["م", "اسم المدرس", "الهاتف", "عدد الحلقات"]):
            tree.heading(col, text=text)

        tree.column("id", width=40, anchor="center")
        tree.column("name", width=250)
        tree.column("phone", width=150, anchor="center")
        tree.column("circles_count", width=100, anchor="center")

        teachers = self.db.get_teachers()
        for t in teachers:
            circles_count = len([c for c in self.db.get_circles() if c["teacher_id"] == t["id"]])
            tree.insert("", "end", values=(t["id"], t["name"], t["phone"], circles_count))

        tree.pack(fill="both", expand=True, pady=10)

    def add_teacher_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("إضافة مدرس جديد")
        dialog.geometry("400x300")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="إضافة مدرس جديد", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        tk.Label(dialog, text="اسم المدرس:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        name_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        name_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="الهاتف:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        phone_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        phone_entry.pack(anchor="ne", padx=20, pady=2)

        def save():
            name = name_entry.get().strip()
            phone = phone_entry.get().strip()
            if not name:
                messagebox.showerror("خطأ", "يرجى إدخال اسم المدرس", parent=dialog)
                return
            self.db.add_teacher(name, phone)
            messagebox.showinfo("نجاح", "تم إضافة المدرس بنجاح", parent=dialog)
            dialog.destroy()
            self.show_teachers()

        tk.Button(dialog, text="حفظ", font=self.font_normal, bg="#27ae60",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def delete_teacher(self):
        tree = self.content_frame.winfo_children()[-1]
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار مدرس للحذف")
            return
        teacher_id = int(tree.item(selected[0])["values"][0])
        if messagebox.askyesno("تأكيد الحذف", "هل أنت متأكد من حذف هذا المدرس؟"):
            self.db.delete_teacher(teacher_id)
            messagebox.showinfo("نجاح", "تم حذف المدرس بنجاح")
            self.show_teachers()

    # ==================== الأهداف الربعية ====================
    def show_goals(self):
        self.clear_content()

        toolbar = tk.Frame(self.content_frame, bg="#f0f4f8")
        toolbar.pack(fill="x", pady=5)

        tk.Button(toolbar, text="إضافة هدف ربعي", font=self.font_normal,
                 bg="#27ae60", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.add_goal_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="تعديل الهدف المحدد", font=self.font_normal,
                 bg="#3498db", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.edit_goal_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="حذف الهدف المحدد", font=self.font_normal,
                 bg="#e74c3c", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.delete_goal).pack(side="right", padx=5)

        columns = ("id", "circle", "quarter", "target", "completed", "progress", "evaluation")
        tree = ttk.Treeview(self.content_frame, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["م", "الحلقة", "الربع", "الهدف (صفحة)", "المنجز", "التقدم", "تقييم الموجه"]):
            tree.heading(col, text=text)

        tree.column("id", width=40, anchor="center")
        tree.column("circle", width=200)
        tree.column("quarter", width=100, anchor="center")
        tree.column("target", width=100, anchor="center")
        tree.column("completed", width=100, anchor="center")
        tree.column("progress", width=100, anchor="center")
        tree.column("evaluation", width=100, anchor="center")

        goals = self.db.get_quarterly_goals()
        for g in goals:
            circle = self.db.get_circle_by_id(g["circle_id"])
            circle_name = circle["name"] if circle else "غير محدد"
            progress = (g["completed_pages"] / g["target_pages"] * 100) if g["target_pages"] > 0 else 0
            tree.insert("", "end", values=(g["id"], circle_name, g["quarter"],
                         g["target_pages"], g["completed_pages"], f"{progress:.1f}%", g["teacher_evaluation"]))

        tree.pack(fill="both", expand=True, pady=10)

    def add_goal_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("إضافة هدف ربعي")
        dialog.geometry("400x400")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="إضافة هدف ربعي جديد", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        tk.Label(dialog, text="الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        circles = self.db.get_circles()
        circle_names = [c["name"] for c in circles] if circles else ["لا يوجد"]
        circle_var = tk.StringVar(value=circle_names[0] if circles else "لا يوجد")
        circle_combo = ttk.Combobox(dialog, textvariable=circle_var, values=circle_names,
                                    width=28, state="readonly")
        circle_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="الربع:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        quarter_var = tk.StringVar(value="الربع الأول")
        quarters = ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"]
        quarter_combo = ttk.Combobox(dialog, textvariable=quarter_var, values=quarters,
                                     width=28, state="readonly")
        quarter_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="الهدف (عدد الصفحات):", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        target_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        target_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="تقييم الموجه (0-1):", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        eval_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        eval_entry.insert(0, "0.9")
        eval_entry.pack(anchor="ne", padx=20, pady=2)

        def save():
            target = target_entry.get().strip()
            evaluation = eval_entry.get().strip()
            if not target or not evaluation:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحصول", parent=dialog)
                return

            circle_id = None
            for c in circles:
                if c["name"] == circle_var.get():
                    circle_id = c["id"]
                    break

            if circle_id is None:
                messagebox.showerror("خطأ", "يرجى إضافة حلقة أولاً", parent=dialog)
                return

            self.db.add_quarterly_goal(circle_id, quarter_var.get(), int(target), float(evaluation))
            messagebox.showinfo("نجاح", "تم إضافة الهدف الربعي بنجاح", parent=dialog)
            dialog.destroy()
            self.show_goals()

        tk.Button(dialog, text="حفظ", font=self.font_normal, bg="#27ae60",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def edit_goal_dialog(self):
        selected = self.content_frame.winfo_children()[-1].selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار هدف للتعديل")
            return
        goal_id = int(self.content_frame.winfo_children()[-1].item(selected[0])["values"][0])
        goal = self.db.get_goal_by_id(goal_id)
        if not goal:
            return

        dialog = tk.Toplevel(self.root)
        dialog.title("تعديل الهدف الربعي")
        dialog.geometry("400x400")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="تعديل الهدف الربعي", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        tk.Label(dialog, text="الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        circles = self.db.get_circles()
        circle_names = [c["name"] for c in circles] if circles else ["لا يوجد"]
        circle_var = tk.StringVar(value=circle_names[0] if circles else "لا يوجد")
        circle_combo = ttk.Combobox(dialog, textvariable=circle_var, values=circle_names,
                                    width=28, state="readonly")
        circle_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="الربع:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        quarter_var = tk.StringVar(value=goal["quarter"])
        quarters = ["الربع الأول", "الربع الثاني", "الربع الثالث", "الربع الرابع"]
        quarter_combo = ttk.Combobox(dialog, textvariable=quarter_var, values=quarters,
                                     width=28, state="readonly")
        quarter_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="الهدف (عدد الصفحات):", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        target_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        target_entry.insert(0, str(goal["target_pages"]))
        target_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="المنجز (عدد الصفحات):", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        completed_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        completed_entry.insert(0, str(goal["completed_pages"]))
        completed_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="تقييم الموجه (0-1):", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        eval_entry = tk.Entry(dialog, font=self.font_normal, width=30)
        eval_entry.insert(0, str(goal["teacher_evaluation"]))
        eval_entry.pack(anchor="ne", padx=20, pady=2)

        def save():
            target = target_entry.get().strip()
            completed = completed_entry.get().strip()
            evaluation = eval_entry.get().strip()
            if not target or not completed or not evaluation:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحقول", parent=dialog)
                return

            circle_id = None
            for c in circles:
                if c["name"] == circle_var.get():
                    circle_id = c["id"]
                    break

            if circle_id is None:
                messagebox.showerror("خطأ", "يرجى إضافة حلقة أولاً", parent=dialog)
                return

            self.db.update_goal(goal_id, circle_id=circle_id, quarter=quarter_var.get(),
                               target_pages=int(target), completed_pages=int(completed),
                               teacher_evaluation=float(evaluation))
            messagebox.showinfo("نجاح", "تم تعديل الهدف الربعي بنجاح", parent=dialog)
            dialog.destroy()
            self.show_goals()

        tk.Button(dialog, text="حفظ التعديلات", font=self.font_normal, bg="#3498db",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def delete_goal(self):
        tree = self.content_frame.winfo_children()[-1]
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار هدف للحذف")
            return
        goal_id = int(tree.item(selected[0])["values"][0])
        if messagebox.askyesno("تأكيد الحذف", "هل أنت متأكد من حذف هذا الهدف؟"):
            self.db.delete_goal(goal_id)
            messagebox.showinfo("نجاح", "تم حذف الهدف بنجاح")
            self.show_goals()

    # ==================== التقييمات ====================
    def show_evaluations(self):
        self.clear_content()

        toolbar = tk.Frame(self.content_frame, bg="#f0f4f8")
        toolbar.pack(fill="x", pady=5)

        tk.Button(toolbar, text="إضافة تقييم", font=self.font_normal,
                 bg="#27ae60", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.add_evaluation_dialog).pack(side="right", padx=5)
        tk.Button(toolbar, text="حذف التقييم المحدد", font=self.font_normal,
                 bg="#e74c3c", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.delete_evaluation).pack(side="right", padx=5)

        columns = ("id", "circle", "evaluator", "evaluation", "notes", "date")
        tree = ttk.Treeview(self.content_frame, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["م", "الحلقة", "المقيّم", "التقييم", "ملاحظات", "التاريخ"]):
            tree.heading(col, text=text)

        tree.column("id", width=40, anchor="center")
        tree.column("circle", width=200)
        tree.column("evaluator", width=150)
        tree.column("evaluation", width=100, anchor="center")
        tree.column("notes", width=250)
        tree.column("date", width=120, anchor="center")

        evals = self.db.get_evaluations()
        for e in evals:
            circle = self.db.get_circle_by_id(e["circle_id"])
            circle_name = circle["name"] if circle else "غير محدد"
            date_str = e["created_at"][:10] if e.get("created_at") else ""
            tree.insert("", "end", values=(e["id"], circle_name, e["evaluator_name"],
                         e["evaluation"], e["notes"], date_str))

        tree.pack(fill="both", expand=True, pady=10)

    def add_evaluation_dialog(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("إضافة تقييم جديد")
        dialog.geometry("450x400")
        dialog.configure(bg="white")
        dialog.transient(self.root)
        dialog.grab_set()

        tk.Label(dialog, text="إضافة تقييم جديد", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        tk.Label(dialog, text="الحلقة:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        circles = self.db.get_circles()
        circle_names = [c["name"] for c in circles] if circles else ["لا يوجد"]
        circle_var = tk.StringVar(value=circle_names[0] if circles else "لا يوجد")
        circle_combo = ttk.Combobox(dialog, textvariable=circle_var, values=circle_names,
                                    width=32, state="readonly")
        circle_combo.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="اسم المقيّم:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        evaluator_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        evaluator_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="التقييم (0-1):", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        eval_entry = tk.Entry(dialog, font=self.font_normal, width=35)
        eval_entry.pack(anchor="ne", padx=20, pady=2)

        tk.Label(dialog, text="ملاحظات:", font=self.font_normal, bg="white").pack(anchor="ne", padx=20)
        notes_text = tk.Text(dialog, font=self.font_normal, width=35, height=5)
        notes_text.pack(anchor="ne", padx=20, pady=2)

        def save():
            evaluator = evaluator_entry.get().strip()
            evaluation = eval_entry.get().strip()
            notes = notes_text.get("1.0", "end-1c").strip()
            if not evaluator or not evaluation:
                messagebox.showerror("خطأ", "يرجى ملء جميع الحقول المطلوبة", parent=dialog)
                return

            circle_id = None
            for c in circles:
                if c["name"] == circle_var.get():
                    circle_id = c["id"]
                    break

            if circle_id is None:
                messagebox.showerror("خطأ", "يرجى إضافة حلقة أولاً", parent=dialog)
                return

            self.db.add_evaluation(circle_id, evaluator, float(evaluation), notes)
            messagebox.showinfo("نجاح", "تم إضافة التقييم بنجاح", parent=dialog)
            dialog.destroy()
            self.show_evaluations()

        tk.Button(dialog, text="حفظ", font=self.font_normal, bg="#27ae60",
                 fg="white", padx=20, pady=5, command=save).pack(pady=15)
        tk.Button(dialog, text="إلغاء", font=self.font_normal, bg="#95a5a6",
                 fg="white", padx=20, pady=5, command=dialog.destroy).pack()

    def delete_evaluation(self):
        tree = self.content_frame.winfo_children()[-1]
        selected = tree.selection()
        if not selected:
            messagebox.showwarning("تنبيه", "يرجى اختيار تقييم للحذف")
            return
        eval_id = int(tree.item(selected[0])["values"][0])
        if messagebox.askyesno("تأكيد الحذف", "هل أنت متأكد من حذف هذا التقييم؟"):
            self.db.delete_evaluation(eval_id)
            messagebox.showinfo("نجاح", "تم حذف التقييم بنجاح")
            self.show_evaluations()

    # ==================== التقارير ====================
    def show_reports(self):
        self.clear_content()

        toolbar = tk.Frame(self.content_frame, bg="#f0f4f8")
        toolbar.pack(fill="x", pady=5)

        tk.Button(toolbar, text="تصدير إلى Excel", font=self.font_normal,
                 bg="#27ae60", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.export_to_excel).pack(side="right", padx=5)
        tk.Button(toolbar, text="تقرير الإنجاز الربعي", font=self.font_normal,
                 bg="#3498db", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.show_quarterly_report).pack(side="right", padx=5)
        tk.Button(toolbar, text="تقرير الترتيبات", font=self.font_normal,
                 bg="#9b59b6", fg="white", padx=15, pady=5, cursor="hand2",
                 command=self.show_rankings_report).pack(side="right", padx=5)

        # ملخص التقرير
        stats = self.db.get_statistics()

        report_frame = tk.Frame(self.content_frame, bg="white", relief="solid", borderwidth=1)
        report_frame.pack(fill="both", expand=True, pady=10)

        tk.Label(report_frame, text="ملخص التقرير العام", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=15)

        report_text = f"""
عدد الحلقات: {stats['total_circles']}
عدد الطلاب: {stats['total_students']}
عدد المدرسين: {stats['total_teachers']}
متوسط الإنجاز: {stats['avg_completion']:.1f}%

ملاحظات:
- جميع البيانات محفوظة محلياً في قاعدة بيانات JSON
- يمكن تصدير التقارير إلى Excel في أي وقت
- يتم حفظ التعديلات تلقائياً
        """

        tk.Label(report_frame, text=report_text, font=self.font_normal,
                bg="white", fg="#2c3e50", justify="right").pack(pady=10)

    def show_quarterly_report(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("تقرير الإنجاز الربعي")
        dialog.geometry("800x600")
        dialog.configure(bg="white")

        tk.Label(dialog, text="تقرير الإنجاز الربعي", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=10)

        # فلتر حسب الحلقة
        circles = self.db.get_circles()
        tk.Label(dialog, text="اختر الحلقة:", font=self.font_normal, bg="white").pack()
        circle_var = tk.StringVar(value="الكل")
        circle_combo = ttk.Combobox(dialog, textvariable=circle_var,
                                    values=["الكل"] + [c["name"] for c in circles],
                                    width=30, state="readonly")
        circle_combo.pack(pady=5)
        circle_combo.bind("<<ComboboxSelected>>", lambda e: self.refresh_quarterly_report(tree, circle_var.get()))

        columns = ("circle", "quarter", "target", "completed", "progress", "evaluation")
        tree = ttk.Treeview(dialog, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["الحلقة", "الربع", "الهدف", "المنجز", "التقدم", "تقييم الموجه"]):
            tree.heading(col, text=text)

        tree.column("circle", width=200)
        tree.column("quarter", width=100, anchor="center")
        tree.column("target", width=100, anchor="center")
        tree.column("completed", width=100, anchor="center")
        tree.column("progress", width=100, anchor="center")
        tree.column("evaluation", width=100, anchor="center")

        self.refresh_quarterly_report(tree, "الكل")
        tree.pack(fill="both", expand=True, padx=10, pady=10)

    def refresh_quarterly_report(self, tree, filter_name):
        for item in tree.get_children():
            tree.delete(item)

        goals = self.db.get_quarterly_goals()
        for g in goals:
            circle = self.db.get_circle_by_id(g["circle_id"])
            circle_name = circle["name"] if circle else "غير محدد"
            if filter_name == "الكل" or circle_name == filter_name:
                progress = (g["completed_pages"] / g["target_pages"] * 100) if g["target_pages"] > 0 else 0
                tree.insert("", "end", values=(circle_name, g["quarter"], g["target_pages"],
                             g["completed_pages"], f"{progress:.1f}%", g["teacher_evaluation"]))

    def show_rankings_report(self):
        dialog = tk.Toplevel(self.root)
        dialog.title("تقرير الترتيبات")
        dialog.geometry("800x600")
        dialog.configure(bg="white")

        tk.Label(dialog, text="تقرير الترتيبات", font=self.font_header,
                bg="white", fg="#2c3e50").pack(pady=10)

        # حساب الترتيبات
        circles = self.db.get_circles()
        goals = self.db.get_quarterly_goals()
        evals = self.db.get_evaluations()

        # حساب الإجمالي لكل حلقة
        circle_totals = {}
        for c in circles:
            total_score = 0
            count = 0
            for g in goals:
                if g["circle_id"] == c["id"]:
                    progress = g["completed_pages"] / g["target_pages"] if g["target_pages"] > 0 else 0
                    total_score += progress * 0.7 + g["teacher_evaluation"] * 0.3
                    count += 1
            for e in evals:
                if e["circle_id"] == c["id"]:
                    total_score += e["evaluation"]
                    count += 1
            circle_totals[c["id"]] = total_score / count if count > 0 else 0

        # ترتيب الحلقات
        sorted_circles = sorted(circle_totals.items(), key=lambda x: x[1], reverse=True)

        columns = ("rank", "circle", "mosque", "score")
        tree = ttk.Treeview(dialog, columns=columns, show="headings", height=20)

        for col, text in zip(columns, ["الترتيب", "الحلقة", "المسجد", "الإجمالي"]):
            tree.heading(col, text=text)

        tree.column("rank", width=80, anchor="center")
        tree.column("circle", width=250)
        tree.column("mosque", width=250)
        tree.column("score", width=100, anchor="center")

        rank_names = ["الأول", "الثاني", "الثالث", "الرابع", "الخامس", "السادس",
                      "السابع", "الثامن", "التاسع", "العاشر"]

        for i, (circle_id, score) in enumerate(sorted_circles):
            circle = self.db.get_circle_by_id(circle_id)
            rank = rank_names[i] if i < len(rank_names) else str(i + 1)
            tree.insert("", "end", values=(rank, circle["name"], circle["mosque"], f"{score:.4f}"))

        tree.pack(fill="both", expand=True, padx=10, pady=10)

    def export_to_excel(self):
        try:
            import openpyxl
        except ImportError:
            messagebox.showerror("خطأ", "يرجى تثبيت openpyxl: py -m pip install openpyxl")
            return

        wb = openpyxl.Workbook()

        # ورقة الحلقات
        ws1 = wb.active
        ws1.title = "الحلقات"
        ws1.append(["م", "اسم الحلقة", "المسجد", "المدرس", "النوع"])
        circles = self.db.get_circles()
        for c in circles:
            teacher = self.db.get_teacher_by_id(c["teacher_id"])
            teacher_name = teacher["name"] if teacher else "غير محدد"
            ws1.append([c["id"], c["name"], c["mosque"], teacher_name, c["gender"]])

        # ورقة الطلاب
        ws2 = wb.create_sheet("الطلاب")
        ws2.append(["م", "اسم الطالب", "الحلقة", "السورة", "آخر جزء", "بداية الخطة"])
        students = self.db.get_students()
        for s in students:
            circle = self.db.get_circle_by_id(s["circle_id"])
            circle_name = circle["name"] if circle else "غير محدد"
            ws2.append([s["id"], s["name"], circle_name, s["surah_name"], s["last_juz"], s["start_surah"]])

        # ورقة المدرسين
        ws3 = wb.create_sheet("المدرسون")
        ws3.append(["م", "اسم المدرس", "الهاتف"])
        teachers = self.db.get_teachers()
        for t in teachers:
            ws3.append([t["id"], t["name"], t["phone"]])

        # ورقة الأهداف الربعية
        ws4 = wb.create_sheet("الأهداف الربعية")
        ws4.append(["م", "الحلقة", "الربع", "الهدف", "المنجز", "تقييم الموجه"])
        goals = self.db.get_quarterly_goals()
        for g in goals:
            circle = self.db.get_circle_by_id(g["circle_id"])
            circle_name = circle["name"] if circle else "غير محدد"
            ws4.append([g["id"], circle_name, g["quarter"], g["target_pages"], g["completed_pages"], g["teacher_evaluation"]])

        filename = filedialog.asksaveasfilename(defaultextension=".xlsx",
                                                filetypes=[("Excel files", "*.xlsx")])
        if filename:
            wb.save(filename)
            messagebox.showinfo("نجاح", f"تم تصدير البيانات إلى {filename}")


def main():
    root = tk.Tk()
    app = HalakatApp(root)
    root.mainloop()


if __name__ == "__main__":
    main()
