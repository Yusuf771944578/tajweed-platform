"""
قاعدة بيانات نظام متابعة حلقات تحفيظ القرآن الكريم
"""
import json
import os
from datetime import datetime


class Database:
    def __init__(self, db_path="halakat_db.json"):
        self.db_path = db_path
        self.data = self.load_data()

    def load_data(self):
        if os.path.exists(self.db_path):
            with open(self.db_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        return {
            "circles": [],
            "students": [],
            "teachers": [],
            "quarterly_goals": [],
            "evaluations": [],
            "next_circle_id": 1,
            "next_student_id": 1,
            "next_teacher_id": 1,
            "next_goal_id": 1,
            "next_eval_id": 1,
        }

    def save_data(self):
        with open(self.db_path, 'w', encoding='utf-8') as f:
            json.dump(self.data, f, ensure_ascii=False, indent=2)

    # إدارة الحلقات
    def add_circle(self, name, mosque, teacher_id, gender, season="2026"):
        circle = {
            "id": self.data["next_circle_id"],
            "name": name,
            "mosque": mosque,
            "teacher_id": teacher_id,
            "gender": gender,
            "season": season,
            "created_at": datetime.now().isoformat(),
            "active": True
        }
        self.data["circles"].append(circle)
        self.data["next_circle_id"] += 1
        self.save_data()
        return circle

    def get_circles(self):
        return self.data["circles"]

    def get_circle_by_id(self, circle_id):
        for c in self.data["circles"]:
            if c["id"] == circle_id:
                return c
        return None

    def update_circle(self, circle_id, **kwargs):
        for c in self.data["circles"]:
            if c["id"] == circle_id:
                c.update(kwargs)
                self.save_data()
                return c
        return None

    def delete_circle(self, circle_id):
        self.data["circles"] = [c for c in self.data["circles"] if c["id"] != circle_id]
        self.save_data()

    # إدارة الطلاب
    def add_student(self, name, circle_id, surah_name, last_juz, start_surah, last_juz_start):
        student = {
            "id": self.data["next_student_id"],
            "name": name,
            "circle_id": circle_id,
            "surah_name": surah_name,
            "last_juz": last_juz,
            "start_surah": start_surah,
            "last_juz_start": last_juz_start,
            "created_at": datetime.now().isoformat()
        }
        self.data["students"].append(student)
        self.data["next_student_id"] += 1
        self.save_data()
        return student

    def get_students(self):
        return self.data["students"]

    def get_students_by_circle(self, circle_id):
        return [s for s in self.data["students"] if s["circle_id"] == circle_id]

    def get_student_by_id(self, student_id):
        for s in self.data["students"]:
            if s["id"] == student_id:
                return s
        return None

    def update_student(self, student_id, **kwargs):
        for s in self.data["students"]:
            if s["id"] == student_id:
                s.update(kwargs)
                self.save_data()
                return s
        return None

    def delete_student(self, student_id):
        self.data["students"] = [s for s in self.data["students"] if s["id"] != student_id]
        self.save_data()

    # إدارة المدرسين
    def add_teacher(self, name, phone=""):
        teacher = {
            "id": self.data["next_teacher_id"],
            "name": name,
            "phone": phone,
            "created_at": datetime.now().isoformat()
        }
        self.data["teachers"].append(teacher)
        self.data["next_teacher_id"] += 1
        self.save_data()
        return teacher

    def get_teachers(self):
        return self.data["teachers"]

    def get_teacher_by_id(self, teacher_id):
        for t in self.data["teachers"]:
            if t["id"] == teacher_id:
                return t
        return None

    def delete_teacher(self, teacher_id):
        self.data["teachers"] = [t for t in self.data["teachers"] if t["id"] != teacher_id]
        self.save_data()

    # الأهداف الربعية
    def add_quarterly_goal(self, circle_id, quarter, target_pages, teacher_evaluation=0):
        goal = {
            "id": self.data["next_goal_id"],
            "circle_id": circle_id,
            "quarter": quarter,
            "target_pages": target_pages,
            "completed_pages": 0,
            "teacher_evaluation": teacher_evaluation,
            "created_at": datetime.now().isoformat()
        }
        self.data["quarterly_goals"].append(goal)
        self.data["next_goal_id"] += 1
        self.save_data()
        return goal

    def get_quarterly_goals(self):
        return self.data["quarterly_goals"]

    def get_goal_by_id(self, goal_id):
        for g in self.data["quarterly_goals"]:
            if g["id"] == goal_id:
                return g
        return None

    def update_goal(self, goal_id, **kwargs):
        for g in self.data["quarterly_goals"]:
            if g["id"] == goal_id:
                g.update(kwargs)
                self.save_data()
                return g
        return None

    def delete_goal(self, goal_id):
        self.data["quarterly_goals"] = [g for g in self.data["quarterly_goals"] if g["id"] != goal_id]
        self.save_data()

    # التقييمات
    def add_evaluation(self, circle_id, evaluator_name, evaluation, notes=""):
        eval_record = {
            "id": self.data["next_eval_id"],
            "circle_id": circle_id,
            "evaluator_name": evaluator_name,
            "evaluation": evaluation,
            "notes": notes,
            "created_at": datetime.now().isoformat()
        }
        self.data["evaluations"].append(eval_record)
        self.data["next_eval_id"] += 1
        self.save_data()
        return eval_record

    def get_evaluations(self):
        return self.data["evaluations"]

    def delete_evaluation(self, eval_id):
        self.data["evaluations"] = [e for e in self.data["evaluations"] if e["id"] != eval_id]
        self.save_data()

    # إحصائيات
    def get_statistics(self):
        total_circles = len(self.data["circles"])
        total_students = len(self.data["students"])
        total_teachers = len(self.data["teachers"])

        # حساب متوسط الإنجاز
        goals = self.data["quarterly_goals"]
        if goals:
            total_target = sum(g["target_pages"] for g in goals)
            total_completed = sum(g["completed_pages"] for g in goals)
            avg_completion = (total_completed / total_target * 100) if total_target > 0 else 0
        else:
            avg_completion = 0

        return {
            "total_circles": total_circles,
            "total_students": total_students,
            "total_teachers": total_teachers,
            "avg_completion": avg_completion,
        }
