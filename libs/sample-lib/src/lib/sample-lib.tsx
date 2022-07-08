import styles from './sample-lib.module.css';

/* eslint-disable-next-line */
export interface SampleLibProps {}

export function SampleLib(props: SampleLibProps) {
  return (
    <div className={styles['container']}>
      <h1>Welcome to SampleLib!</h1>
    </div>
  );
}

export default SampleLib;
