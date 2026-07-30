export interface ToggleBaseProps {
  toggleTitle?: string
  checked: boolean
  disabled?: boolean
  onChange: (checked: boolean) => void
}
