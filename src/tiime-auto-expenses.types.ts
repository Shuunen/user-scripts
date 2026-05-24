export type Expense = {
  /** The label of the expense that will be used for the name and label/tag, example: "Internet subscription" */
  label: string
  /** The comment/description of the expense */
  comment: string
  /** The TTC amount of the expense, example: 49.99 */
  amount: number
  /** The TVA amount of the expense, example: 4.5 */
  tva: number
}
