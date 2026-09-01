export type TodayWidgetHabit = {
  id: number;
  name: string;
  emoji: string;
  done: boolean;
};

export type TodayWidgetProps = {
  done: number;
  total: number;
  streak: number;
  habits: TodayWidgetHabit[];
};