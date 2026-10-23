export interface Board {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
  item_count?: number;
}

export interface Item {
  id: string;
  board_id: string;
  user_id: string;
  image_url: string;
  link_url: string | null;
  title: string;
  note: string | null;
  created_at: string;
}
