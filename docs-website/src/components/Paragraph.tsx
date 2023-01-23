import clsx from 'clsx'
import { FC, ReactNode } from 'react'

export const Paragraph: FC<{ children: ReactNode; className?: string }> = ({
	children,
	className,
}) => {
	return <p className={clsx('leading-relaxed', className)}>{children}</p>
}
