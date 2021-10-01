import css from "./App.module.less"
import React from "react"
import { Link, Stack } from "@cher-ami/router"

const componentName = "App"
const debug = require("debug")(`front:${componentName}`)

export interface IProps {}

function App(props: IProps) {
  return (
    <div className={css.root}>
      <Stack className={css.stack} />
    </div>
  )
}

export default App
