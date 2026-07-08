"use client"

import { createContext, useContext, useId } from "react"
import type { ReactNode } from "react"
import {
  Controller,
  FormProvider,
  useFormContext,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
} from "react-hook-form"

import { Slot } from "radix-ui"
import { cn } from "@/lib/utils"
import { Label } from "@/components/ui/label"
import { FieldError } from "@/components/ui/field"

const Form = FormProvider

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = {
  name: TName
}

const FormFieldContext = createContext<FormFieldContextValue>(
  {} as FormFieldContextValue,
)

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: ControllerProps<TFieldValues, TName>) {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  )
}

const FormItemContext = createContext<{ id: string }>({} as { id: string })

function FormItem({ className, ...props }: React.ComponentProps<"div">) {
  const id = useId()

  return (
    <FormItemContext.Provider value={{ id }}>
      <div
        data-slot="form-item"
        className={cn("group/form-item space-y-1", className)}
        {...props}
      />
    </FormItemContext.Provider>
  )
}

function FormLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  const { name } = useContext(FormFieldContext)

  return (
    <Label
      data-slot="form-label"
      data-invalid={!!useFormContext().formState.errors[name]}
      className={cn(
        "group-data-[invalid=true]/form-item:text-destructive",
        className,
      )}
      htmlFor={useFormContext().formState.errors[name] ? name : undefined}
      {...props}
    />
  )
}

function FormControl({ ...props }: React.ComponentProps<typeof Slot.Root>) {
  const { name } = useContext(FormFieldContext)
  const { getFieldState } = useFormContext()
  const error = getFieldState(name).error

  return (
    <Slot.Root
      data-slot="form-control"
      data-invalid={!!error}
      aria-invalid={!!error}
      {...props}
    />
  )
}

function FormDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="form-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function FormMessage({
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & { children?: ReactNode }) {
  const { name } = useContext(FormFieldContext)
  const { getFieldState } = useFormContext()
  const error = getFieldState(name).error

  if (!error && !children) return null

  return (
    <FieldError
      className={className}
      errors={error ? [error] : []}
      {...props}
    >
      {children}
    </FieldError>
  )
}

export {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
}