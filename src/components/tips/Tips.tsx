import css from "./Tips.module.less"
import React, { useEffect, useRef, useState } from "react"
import { merge } from "../../lib/utils/arrayUtils"

interface IProps {
  className?: string
}

const componentName = "Tips"
const debug = require("debug")(`front:${componentName}`)

/**
 * @name Tips
 */

function useInterval(callback: () => void, delay: number | null) {
  const savedCallback = useRef(callback)

  // Remember the latest callback if it changes.
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up the interval.
  useEffect(() => {
    // Don't schedule if no delay is specified.
    if (delay === null) {
      return
    }

    const id = setInterval(() => savedCallback.current(), delay)

    return () => clearInterval(id)
  }, [delay])
}

function Tips(props: IProps) {
  const tips = [
    "Déplace toi sur la grande carte pour me chercher, clique sur la petite carte pour te déplacer plus rapidement",
    "Regarde dans quel sens la boussole pointe !",
    "Je suis caché quelque part dans l'émisphère nord",
    "Je suis dans une ville qui possède plus d'un million d'habitants",
    "Je suis la plus grande ville de ma région",
    "La ville où je me situe a déjà subi un séisme",
    "Il y a une statue gigantesque près de moi",
  ]
  const [tipsIndex, setTipsIndex] = useState(0)

  useInterval(() => {
    if (tipsIndex === tips.length - 1) {
      setTipsIndex(0)
    } else {
      setTipsIndex(tipsIndex + 1)
    }
  }, 10000)

  return (
    <div className={merge([css.root, props.className])}>
      <p>{tips[tipsIndex]}</p>
    </div>
  )
}

export default Tips
