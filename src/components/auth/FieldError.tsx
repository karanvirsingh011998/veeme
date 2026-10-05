import styles from "./auth-forms.module.css";

type FieldErrorProps = {
  id?: string;
  message?: string;
};

export function FieldError({ id, message }: FieldErrorProps) {
  if (!message) return null;
  return (
    <p id={id} className={styles.error} role="alert">
      {message}
    </p>
  );
}