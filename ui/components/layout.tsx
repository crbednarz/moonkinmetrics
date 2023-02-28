import styles from './layout.module.scss';

export default function Layout({
  children,
  className,
}: {
  children: React.ReactNode,
  className?: string
}) {
  return (
    <div
      className={`${styles.container} ${className ?? '' }`}
    >
      {children}
    </div>
  )

}
