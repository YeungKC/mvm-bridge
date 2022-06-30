/* eslint-disable react-memo/require-usememo */
import { HTMLInputTypeAttribute, memo } from 'react'
import { Controller } from 'react-hook-form'

export const InputItem = memo(
  ({
    name,
    label,
    control,
    rules,
    type = 'text',
    placeholder,
  }: {
    label: string
    type?: HTMLInputTypeAttribute
    placeholder?: string
  } & Omit<Parameters<typeof Controller>[0], 'render'>) => {
    return (
      <Controller
        name={name}
        control={control}
        rules={rules}
        render={({ field, fieldState: { error } }) => (
          <label className='flex flex-col gap-1'>
            <div className=' text-stone-700'>{label}</div>
            <input
              type={type}
              placeholder={placeholder}
              className='w-full rounded-md bg-stone-100'
              {...field}
            />
            <div className='min-h-[14px] text-xs text-red-400'>
              {error?.message ?? ''}
            </div>
          </label>
        )}
      />
    )
  },
)
