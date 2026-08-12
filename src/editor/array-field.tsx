import { PlusIcon } from '../components/icons'

type Props = {
  label: string
  values: string[]
  onChange: (values: string[]) => void
  placeholder?: string
  multiline?: boolean
}

export function ArrayField({ label, values, onChange, placeholder = '入力してください', multiline = false }: Props) {
  function update(index: number, value: string) {
    onChange(values.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction
    if (target < 0 || target >= values.length) return
    const next = [...values]
    ;[next[index], next[target]] = [next[target], next[index]]
    onChange(next)
  }

  return (
    <fieldset className="editor-array-field">
      <legend>{label}</legend>
      <div className="editor-array-rows">
        {values.map((value, index) => (
          <div className="editor-array-row" key={index}>
            <span aria-hidden="true" className="drag-mark">⋮⋮</span>
            {multiline ? (
              <textarea aria-label={`${label} ${index + 1}`} onChange={(event) => update(index, event.target.value)} placeholder={placeholder} rows={2} value={value} />
            ) : (
              <input aria-label={`${label} ${index + 1}`} onChange={(event) => update(index, event.target.value)} placeholder={placeholder} value={value} />
            )}
            <div className="array-actions">
              <button aria-label="上へ移動" disabled={index === 0} onClick={() => move(index, -1)} type="button">↑</button>
              <button aria-label="下へ移動" disabled={index === values.length - 1} onClick={() => move(index, 1)} type="button">↓</button>
              <button aria-label="削除" className="danger-text" onClick={() => onChange(values.filter((_, itemIndex) => itemIndex !== index))} type="button">削除</button>
            </div>
          </div>
        ))}
      </div>
      <button className="editor-add-row" onClick={() => onChange([...values, ''])} type="button"><PlusIcon size={16} />追加</button>
    </fieldset>
  )
}
