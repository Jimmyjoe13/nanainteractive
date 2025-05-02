interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  colorClass: string;
}

export default function FeatureCard({ icon, title, description, colorClass }: FeatureCardProps) {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-neutral-200 text-center">
      <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full ${colorClass} mb-4`}>
        {icon}
      </div>
      <h3 className="font-quicksand font-semibold text-lg mb-2">{title}</h3>
      <p className="text-neutral-600">{description}</p>
    </div>
  );
}
