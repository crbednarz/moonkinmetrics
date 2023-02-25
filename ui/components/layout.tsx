import styles from './layout.module.scss';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={styles.container}
    >
      {children}
    </div>
  )

}
