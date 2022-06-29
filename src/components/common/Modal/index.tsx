import {
  DialogContent,
  DialogContentProps,
  DialogOverlay,
  DialogProps,
} from '@reach/dialog'
import classNames from 'classnames'
import {
  AnimatePresence,
  AnimationControls,
  Target,
  TargetAndTransition,
  motion,
} from 'framer-motion'
import { memo, useEffect, useRef } from 'react'
import { usePrevious } from 'react-use'

type PropsType = {
  className?: string
  containerClassName?: string

  initial?: Target
  animate?: AnimationControls | TargetAndTransition
  exit?: TargetAndTransition

  ariaLabel?: string
  ariaLabelledby?: string
} & DialogProps &
  DialogContentProps

const ENTER_TRANSITION = {
  ease: 'easeOut',
  duration: 0.25,
}
const EXIT_TRANSITION = {
  ease: 'easeOut',
  duration: 0.2,
}

const modalInitial = {
  opacity: 0,
}
const modalAnimate = {
  opacity: 1,
  transition: ENTER_TRANSITION,
}
const modalExit = {
  opacity: 0,
  transition: EXIT_TRANSITION,
}

const AnimatedDialogOverlay = motion(DialogOverlay)
const AnimatedDialogContent = motion(DialogContent)

export const Modal = memo(
  ({
    isOpen,
    onDismiss,
    initial,
    animate,
    exit,
    children,
    className,
    containerClassName,
    ariaLabel,
    ariaLabelledby,
    ...props
  }: PropsType) => {
    const scrollPosition = useRef<number | undefined>(undefined)
    const previous = usePrevious(isOpen)

    useEffect(() => {
      if (isOpen) {
        scrollPosition.current = document.scrollingElement?.scrollTop
        return
      }

      const onDismiss = () => {
        if (!previous) return
        if (scrollPosition.current === undefined) return

        window.scrollTo({
          top: scrollPosition.current,
          behavior: 'smooth',
        })

        scrollPosition.current = undefined
      }
      onDismiss()

      // eslint-disable-next-line consistent-return
      return onDismiss
    }, [isOpen, previous])

    return (
      <AnimatePresence>
        {isOpen && (
          <AnimatedDialogOverlay
            {...props}
            isOpen={isOpen}
            onDismiss={onDismiss}
            initial={modalInitial}
            animate={modalAnimate}
            exit={modalExit}
            className={classNames(
              'fixed inset-0 flex flex-col items-center justify-center overflow-auto bg-black bg-opacity-10',
              className,
            )}
          >
            <AnimatedDialogContent
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledby}
              initial={
                initial ?? {
                  opacity: 0,
                }
              }
              animate={
                animate
                  ? {
                      transition: ENTER_TRANSITION,
                      ...animate,
                    }
                  : {
                      opacity: 1,
                      transition: ENTER_TRANSITION,
                    }
              }
              exit={
                exit
                  ? { transition: EXIT_TRANSITION, ...exit }
                  : {
                      opacity: 0,
                      transition: EXIT_TRANSITION,
                    }
              }
              className={classNames(containerClassName)}
            >
              {children}
            </AnimatedDialogContent>
          </AnimatedDialogOverlay>
        )}
      </AnimatePresence>
    )
  },
)

const bottomSheetInitial = {
  translateY: '50%',
}
const bottomSheetAnimate = {
  translateY: 0,
}
const bottomSheetExit = {
  translateY: '100%',
}

export const BottomSheet = memo(
  ({ className, containerClassName, ...props }: PropsType) => (
    <Modal
      {...props}
      className={classNames('!justify-end md:!justify-center', className)}
      containerClassName={classNames(
        'container rounded-t-2xl md:rounded-2xl p-5 bg-white flex flex-col items-center',
        containerClassName,
      )}
      initial={bottomSheetInitial}
      animate={bottomSheetAnimate}
      exit={bottomSheetExit}
      ariaLabel='modal'
    />
  ),
)

const dialogModalInitial = {
  opacity: 0,
  scale: 0.9,
}
const dialogModalAnimate = {
  opacity: 1,
  scale: 1,
}
const dialogModalExit = {
  opacity: 0,
  scale: 0.9,
}
export const DialogModal = memo(
  ({ className, containerClassName, ...props }: PropsType) => (
    <Modal
      {...props}
      initial={dialogModalInitial}
      animate={dialogModalAnimate}
      exit={dialogModalExit}
      className={classNames('p-6', className)}
      containerClassName={classNames(
        'flex flex-col justify-center items-center bg-white p-6 rounded-2xl items-center',
        containerClassName,
      )}
    />
  ),
)
