'use client';

import { useApp } from '@/lib/context';
import { StepSection } from '@/components/ui/StepSection';
import { ChoiceCard } from '@/components/ui/ChoiceCard';

const PLATFORMS = [
  { value: 'web', name: 'Web', description: 'Browser-based application' },
  { value: 'ios', name: 'iOS', description: 'Native iPhone & iPad app' },
  { value: 'android', name: 'Android', description: 'Native Android app' },
  { value: 'desktop', name: 'Desktop', description: 'macOS, Windows, or Linux' },
  {
    value: 'cross-web-mobile',
    name: 'Cross-platform',
    description: 'Web + mobile responsive',
  },
];

export default function StepProject() {
  const { state, updateNestedWizard } = useApp();
  const project = state.wizardState.project;
  const platforms = Array.isArray(project.platform) ? project.platform : [project.platform].filter(Boolean);

  const togglePlatform = (value: string) => {
    const next = platforms.includes(value)
      ? platforms.filter((p) => p !== value)
      : [...platforms, value];
    updateNestedWizard('project', 'platform', next);
  };

  return (
    <StepSection
      id="step-project"
      stepNumber={1}
      totalSteps={13}
      label="Project"
      title="Tell us about the project"
      help="A few basics so the design system brief has context."
    >
      <div className="space-y-8">
        <div>
          <label htmlFor="project-name" className="block text-sm font-medium text-text mb-1.5">
            Project name
          </label>
          <input
            id="project-name"
            type="text"
            value={project.name}
            onChange={(e) => updateNestedWizard('project', 'name', e.target.value)}
            placeholder="e.g. Acme Dashboard"
            className="w-full max-w-md px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors"
          />
        </div>

        <div>
          <label htmlFor="project-description" className="block text-sm font-medium text-text mb-1.5">
            Description
          </label>
          <textarea
            id="project-description"
            value={project.description}
            onChange={(e) => updateNestedWizard('project', 'description', e.target.value)}
            placeholder="What does this product do? Who is it for?"
            rows={3}
            className="w-full max-w-lg px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Platform
          </label>
          <p className="text-xs text-text-muted mb-3">Select all that apply.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {PLATFORMS.map((p) => (
              <ChoiceCard
                key={p.value}
                selected={platforms.includes(p.value)}
                onClick={() => togglePlatform(p.value)}
                name={p.name}
                description={p.description}
              />
            ))}
          </div>
        </div>

        {/* Register */}
        <div>
          <label className="block text-sm font-medium text-text mb-1">
            Register
          </label>
          <p className="text-xs text-text-muted mb-3">
            This changes how the entire design system is oriented. Brand lets design be expressive; Product keeps design out of the way.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-lg">
            <ChoiceCard
              selected={project.register === 'brand'}
              onClick={() => updateNestedWizard('project', 'register', 'brand')}
              name="Brand"
              description="Marketing site, landing page, portfolio. Design is the product — expressive type, art direction, asymmetric layouts."
            />
            <ChoiceCard
              selected={project.register === 'product'}
              onClick={() => updateNestedWizard('project', 'register', 'product')}
              name="Product"
              description="App UI, dashboard, tool. Design serves the product — familiar conventions, restrained palettes, fixed type scales."
            />
          </div>
        </div>

        <div>
          <label htmlFor="project-audience" className="block text-sm font-medium text-text mb-1.5">
            Target audience <span className="text-text-subtle font-normal">(optional)</span>
          </label>
          <input
            id="project-audience"
            type="text"
            value={project.audience}
            onChange={(e) => updateNestedWizard('project', 'audience', e.target.value)}
            placeholder="e.g. Developers, enterprise teams, consumers"
            className="w-full max-w-md px-3.5 py-2.5 bg-surface border border-border rounded-lg text-sm text-text placeholder:text-text-subtle focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent-soft transition-colors"
          />
        </div>
      </div>
    </StepSection>
  );
}
