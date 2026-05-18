export type Subject = "Toan" | "Ly" | "Hoa";

export interface Student {
  id: string;
  name: string;
  salary_per_session: number;
  color: string;
  created_at: string;
  updated_at: string;
}

export interface TeachingSession {
  id: string;
  teaching_date: string;
  subject: Subject;
  student_id: string;
  created_at: string;
}

export type Database = {
  public: {
    Tables: {
      students: {
        Row: Student;
        Insert: Omit<Student, "id" | "created_at" | "updated_at">;
        Update: Partial<Omit<Student, "id" | "created_at" | "updated_at">>;
        Relationships: any[];
      };
      teaching_sessions: {
        Row: TeachingSession;
        Insert: Omit<TeachingSession, "id" | "created_at">;
        Update: Partial<Omit<TeachingSession, "id" | "created_at">>;
        Relationships: any[];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
