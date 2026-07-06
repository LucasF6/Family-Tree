'use client'

import style from "./ErrorMessage.module.css"

type ErrorMessageProps = {
  message: string;
}

export default function ErrorMessage({ message }: ErrorMessageProps) {
  return <p className={style.error}>{message}</p>
}