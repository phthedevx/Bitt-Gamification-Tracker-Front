export function getLocalDateString(data: Date = new Date()): string {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}

export function getLocalYearMonthString(data: Date = new Date()): string {
  return getLocalDateString(data).slice(0, 7)
}
