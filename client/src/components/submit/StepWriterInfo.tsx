import React from 'react';
import { UseFormReturn } from 'react-hook-form';

interface StepWriterInfoProps {
  form: UseFormReturn<any>;
}

export function StepWriterInfo({ form }: StepWriterInfoProps) {
  const { register, formState: { errors } } = form;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold mb-4">Tell us about yourself</h2>

      <div>
        <label className="block text-sm font-medium mb-1">
          Full Name <span className="text-red-500">*</span>
        </label>
        <input
          {...register('writerName')}
          className="w-full p-3 border rounded"
          placeholder="Jane Doe"
        />
        {errors.writerName && (
          <p className="text-red-600 text-sm mt-1">{errors.writerName.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Email <span className="text-red-500">*</span>
        </label>
        <input
          type="email"
          {...register('writerEmail')}
          className="w-full p-3 border rounded"
          placeholder="jane@example.com"
        />
        {errors.writerEmail && (
          <p className="text-red-600 text-sm mt-1">{errors.writerEmail.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Bio <span className="text-gray-500 font-normal">(500 characters max)</span>
        </label>
        <textarea
          {...register('writerBio')}
          className="w-full p-3 border rounded h-32"
          placeholder="Tell us about your writing background..."
        />
        <div className="text-sm text-gray-500 mt-1 text-right">
          {form.watch('writerBio')?.length || 0} / 500
        </div>
        {errors.writerBio && (
          <p className="text-red-600 text-sm mt-1">{errors.writerBio.message as string}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">
          Portfolio Links <span className="text-gray-500 font-normal">(up to 3 samples)</span>
        </label>
        {[0, 1, 2].map(i => (
          <input
            key={i}
            type="url"
            {...register(`portfolioLinks.${i}`)}
            className="w-full p-3 border rounded mb-2"
            placeholder="https://..."
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">
            Twitter/X <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            {...register('socialTwitter')}
            className="w-full p-3 border rounded"
            placeholder="@yourhandle"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">
            Instagram <span className="text-gray-500 font-normal">(optional)</span>
          </label>
          <input
            {...register('socialInstagram')}
            className="w-full p-3 border rounded"
            placeholder="@yourhandle"
          />
        </div>
      </div>
    </div>
  );
}
