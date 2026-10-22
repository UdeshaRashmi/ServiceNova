import { useId } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link } from 'react-router-dom';
import { ArrowRight, Info } from 'lucide-react';
import { categories, priorities } from '../types';
import type { RequestInput } from '../services/api';
import { label } from '../utils/format';

export const requestSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Use at least 5 characters.')
    .max(150, 'Use no more than 150 characters.'),
  description: z
    .string()
    .trim()
    .min(20, 'Add at least 20 characters so we can understand your request.')
    .max(5000, 'Use no more than 5,000 characters.'),
  category: z.enum(categories, { error: 'Select a valid category.' }),
  priority: z.enum(priorities, { error: 'Select a valid priority.' }),
});
export function RequestForm({
  initial,
  onSubmit,
}: {
  initial?: RequestInput;
  onSubmit: (values: RequestInput) => Promise<void>;
}) {
  const fieldId = useId();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RequestInput>({
    resolver: zodResolver(requestSchema),
    defaultValues: initial || {
      title: '',
      description: '',
      category: 'TECHNICAL',
      priority: 'MEDIUM',
    },
  });
  return (
    <div className="form-layout">
      <section className="panel form-panel">
        <div className="panel-heading">
          <div>
            <h2>Request information</h2>
            <p>A few details help us find the right solution.</p>
          </div>
        </div>
        <form
          className="request-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
        >
          <label>
            Request title <span className="required">*</span>
            <input
              placeholder="Give your request a clear, short title"
              {...register('title')}
              aria-required="true"
              aria-describedby={
                errors.title ? `${fieldId}-title-error` : undefined
              }
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <span id={`${fieldId}-title-error`} className="field-error">
                {errors.title.message}
              </span>
            )}
          </label>
          <label>
            Description <span className="required">*</span>
            <textarea
              rows={7}
              placeholder="Tell us what happened, what you expected, and anything else that might help…"
              {...register('description')}
              aria-required="true"
              aria-describedby={
                errors.description
                  ? `${fieldId}-description-error`
                  : `${fieldId}-description-help`
              }
              aria-invalid={!!errors.description}
            />
            <span id={`${fieldId}-description-help`} className="field-help">
              {watch('description')?.length || 0} / 5,000 characters
            </span>
            {errors.description && (
              <span id={`${fieldId}-description-error`} className="field-error">
                {errors.description.message}
              </span>
            )}
          </label>
          <div className="form-row">
            <label>
              Category <span className="required">*</span>
              <select
                {...register('category')}
                aria-required="true"
                aria-describedby={
                  errors.category ? `${fieldId}-category-error` : undefined
                }
                aria-invalid={!!errors.category}
              >
                {categories.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </select>
              {errors.category && (
                <span id={`${fieldId}-category-error`} className="field-error">
                  {errors.category.message}
                </span>
              )}
            </label>
            <label>
              Priority <span className="required">*</span>
              <select
                {...register('priority')}
                aria-required="true"
                aria-describedby={
                  errors.priority ? `${fieldId}-priority-error` : undefined
                }
                aria-invalid={!!errors.priority}
              >
                {priorities.map((value) => (
                  <option key={value} value={value}>
                    {label(value)}
                  </option>
                ))}
              </select>
              {errors.priority && (
                <span id={`${fieldId}-priority-error`} className="field-error">
                  {errors.priority.message}
                </span>
              )}
            </label>
          </div>
          <div className="form-actions">
            <Link className="btn secondary" to="/requests">
              Go back
            </Link>
            <button className="btn primary" disabled={isSubmitting}>
              {isSubmitting
                ? 'Saving…'
                : initial
                  ? 'Save changes'
                  : 'Submit request'}
              <ArrowRight size={16} />
            </button>
          </div>
        </form>
      </section>
      <aside className="tips-card">
        <span className="stat-icon blue">
          <Info size={21} />
        </span>
        <h3>A great request gets things moving.</h3>
        <p>Be specific about the issue and include the steps that led to it.</p>
        <ul>
          <li>Choose a descriptive title.</li>
          <li>Pick the most relevant category.</li>
          <li>Set a priority that reflects the impact.</li>
          <li>Keep passwords and sensitive details out.</li>
        </ul>
        <div className="tips-note">
          New requests start as <strong>Pending</strong>. You can edit or cancel
          them before work begins.
        </div>
      </aside>
    </div>
  );
}
