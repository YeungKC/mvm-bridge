import { ReactNode, memo } from 'react'

import { DialogModal } from '../Modal'
import { Spinner } from '../Spinner'

const SpinnerModal = memo(
  ({ isOpen, children }: { isOpen: boolean; children?: ReactNode }) => (
    <DialogModal isOpen={isOpen} containerClassName='gap-4'>
      <Spinner />
      {children}
    </DialogModal>
  ),
)

export default SpinnerModal
