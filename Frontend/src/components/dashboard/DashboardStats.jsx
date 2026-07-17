import { getSafeNumber } from './dashboardUtils.js'
import SummaryCard from './SummaryCard.jsx'

export default function DashboardStats({ summary }) {
  const cards = [
    {
      label: 'Projects',
      value: getSafeNumber(summary?.total_projects),
      subtitle: 'Total Projects',
    },
    {
      label: 'Tasks',
      value: getSafeNumber(summary?.total_tasks),
      subtitle: 'Total Tasks',
    },
    {
      label: 'In Progress',
      value: getSafeNumber(summary?.in_progress_tasks),
      subtitle: 'Tasks',
    },
    {
      label: 'Completed',
      value: getSafeNumber(summary?.completed_tasks),
      subtitle: 'Tasks',
    },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <SummaryCard key={card.label} label={card.label} value={card.value} subtitle={card.subtitle} />
      ))}
    </div>
  )
}
