export default function PageHeader({ title, description, icon: Icon }) {
  return (
    <div className="mb-6 animate-fade-in-up">
      <div className="flex items-center gap-3 mb-1">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500/10 to-primary-600/10 border border-primary-200/50 flex items-center justify-center">
            <Icon className="w-5 h-5 text-primary-600" />
          </div>
        )}
        <div>
          <h2 className="text-xl font-bold text-surface-900 tracking-tight">{title}</h2>
          {description && (
            <p className="text-sm text-surface-500 mt-0.5">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
