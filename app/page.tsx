"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Info, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink, AlignJustify } from "lucide-react"
import Link from "next/link"

interface BalloonData {
  globo: number
  inflaciones: number
  exploto: boolean
  puntos_ganados: number
  punto_explosion: number
}

type GameState = "consent" | "instructions" | "playing" | "results"

export default function BARTTask() {
  const [gameState, setGameState] = useState<GameState>("consent")
  const [currentBalloon, setCurrentBalloon] = useState(1)
  const [currentInflations, setCurrentInflations] = useState(0)
  const [currentPoints, setCurrentPoints] = useState(0)
  const [totalPoints, setTotalPoints] = useState(0)
  const [completedBalloons, setCompletedBalloons] = useState(0)
  const [balloonData, setBalloonData] = useState<BalloonData[]>([])
  const [isExploding, setIsExploding] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [consentAccepted, setConsentAccepted] = useState<boolean | null>(null)
  const [showInformation, setShowInformation] = useState(false)
  const [countdown, setCountdown] = React.useState(3)
  const [baseRedirectUrl] = React.useState(
    "https://encuestas3.unc.edu.ar/index.php?r=survey/index&sid=892672&lang=es",
  ) // CAMBIAR ESTE LINK

  const inflateBalloon = () => {
    if (isExploding || showSuccess) return

    const newInflations = currentInflations + 1
    const newPoints = currentPoints + 5

    setCurrentInflations(newInflations)
    setCurrentPoints(newPoints)

    // Calcular probabilidad de explosión creciente
    // Fórmula: 1/(128-(i-1)) = 1/(129-i)
    if (newInflations <= 128) {
      const probabilityOfExplosion = 1 / (128 - (newInflations - 1))
      const randomValue = Math.random()

      console.log(
        `Inflación ${newInflations}: Probabilidad = ${(probabilityOfExplosion * 100).toFixed(2)}%, Random = ${randomValue.toFixed(4)}`,
      )

      if (randomValue < probabilityOfExplosion) {
        explodeBalloon(newInflations)
      }
    }
  }

  const explodeBalloon = (inflations: number = currentInflations + 1) => {
    setIsExploding(true)

    // Registrar datos del globo explotado
    const balloonInfo: BalloonData = {
      globo: currentBalloon,
      inflaciones: inflations,
      exploto: true,
      puntos_ganados: 0,
      punto_explosion: inflations, // El punto donde explotó
    }
    setBalloonData((prev) => [...prev, balloonInfo])

    setTimeout(() => {
      setIsExploding(false)
      nextBalloon()
    }, 1500)
  }

  const collectPoints = () => {
    if (isExploding || showSuccess) return

    setShowSuccess(true)
    const earnedPoints = currentPoints
    setTotalPoints((prev) => prev + earnedPoints)

    // Registrar datos del globo cobrado
    const balloonInfo: BalloonData = {
      globo: currentBalloon,
      inflaciones: currentInflations,
      exploto: false,
      puntos_ganados: earnedPoints,
      punto_explosion: currentInflations, // Punto donde se cobró
    }
    setBalloonData((prev) => [...prev, balloonInfo])

    setTimeout(() => {
      setShowSuccess(false)
      nextBalloon()
    }, 1000)
  }

  const nextBalloon = () => {
    if (currentBalloon >= 5) {
      setGameState("results")
      return
    }

    setCurrentBalloon((prev) => prev + 1)
    setCompletedBalloons((prev) => prev + 1)
    resetBalloonState()
  }

  const resetBalloonState = () => {
    setCurrentInflations(0)
    setCurrentPoints(0)
  }

  const startGame = () => {
    setGameState("playing")
    setCurrentBalloon(1)
    setCompletedBalloons(0)
    setTotalPoints(0)
    setBalloonData([])
    resetBalloonState()
  }

  const handleConsent = (accepted: boolean) => {
    setConsentAccepted(accepted)

    if (accepted) {
      setGameState("instructions")
    } else {
      // Redirección inmediata si no acepta
      const baseRedirectUrl = "https://encuestas3.unc.edu.ar/index.php?r=survey/index&sid=892672&lang=es"
      const urlParams = new URLSearchParams()
      urlParams.append("consentimiento_aceptado", "no")
      urlParams.append("timestamp", new Date().toISOString())

      const separator = baseRedirectUrl.includes("?") ? "&" : "?"
      const finalUrl = `${baseRedirectUrl}${separator}${urlParams.toString()}`

      console.log("Redirigiendo sin consentimiento:", finalUrl)
      window.location.href = finalUrl
    }
  }

  const calculateResults = () => {
    const globos_no_explotados = balloonData.filter((b) => !b.exploto)
    const globos_explotados = balloonData.filter((b) => b.exploto)

    // Total de infladas en globos no explotados
    const total_infladas_no_explotados = globos_no_explotados.reduce((sum, b) => sum + b.inflaciones, 0)

    // Total de infladas en todos los globos (explotados y no explotados)
    const total_infladas_todos = balloonData.reduce((sum, b) => sum + b.inflaciones, 0)

    // Promedio ajustado = total infladas no explotados / total globos no explotados
    const promedio_ajustado =
      globos_no_explotados.length > 0
        ? Math.round((total_infladas_no_explotados / globos_no_explotados.length) * 10) / 10
        : 0

    // Promedio no ajustado = total infladas todos / total globos
    const promedio_no_ajustado =
      balloonData.length > 0 ? Math.round((total_infladas_todos / balloonData.length) * 10) / 10 : 0

    // Total de globos explotados
    const total_globos_explotados = globos_explotados.length

    // Total de infladas en el globo más inflado
    const max_infladas = balloonData.length > 0 ? Math.max(...balloonData.map((b) => b.inflaciones)) : 0

    // Total de puntos obtenidos
    const total_puntos = totalPoints

    return {
      promedio_ajustado,
      promedio_no_ajustado,
      total_globos_explotados,
      max_infladas,
      total_puntos,
      detalles_por_globo: balloonData,
    }
  }

  const getBalloonSize = () => {
    const baseSize = 80
    const maxSize = 200
    const sizeIncrease = (maxSize - baseSize) * (currentInflations / 50)
    return Math.min(baseSize + sizeIncrease, maxSize)
  }

  React.useEffect(() => {
    if (gameState !== "results") return
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(timer)
    }
  }, [gameState])

  React.useEffect(() => {
    if (countdown === 0 && gameState === "results") {
      // Crear URL con resultados como parámetros
      const results = calculateResults()
      const urlParams = new URLSearchParams()

      // Agregar parámetros de resultados a la URL
      urlParams.append("timestamp", new Date().toISOString())
      urlParams.append("consentimiento_aceptado", consentAccepted ? "si" : "no")
      urlParams.append("promedio_ajustado", results.promedio_ajustado.toString())
      urlParams.append("promedio_no_ajustado", results.promedio_no_ajustado.toString())
      urlParams.append("total_globos_explotados", results.total_globos_explotados.toString())
      urlParams.append("max_infladas", results.max_infladas.toString())
      urlParams.append("total_puntos", results.total_puntos.toString())

      // Construir URL final
      const separator = baseRedirectUrl.includes("?") ? "&" : "?"
      const finalUrl = `${baseRedirectUrl}${separator}${urlParams.toString()}`

      console.log("Redirigiendo con resultados:", finalUrl)
      window.location.href = finalUrl
    }
  }, [gameState, countdown])

  const handleReturnToSurvey = () => {
    // Crear URL con resultados como parámetros
    const results = calculateResults()
    const urlParams = new URLSearchParams()

    // Agregar parámetros de resultados a la URL
    urlParams.append("timestamp", new Date().toISOString())
    urlParams.append("consentimiento_aceptado", consentAccepted ? "si" : "no")
    urlParams.append("promedio_ajustado", results.promedio_ajustado.toString())
    urlParams.append("promedio_no_ajustado", results.promedio_no_ajustado.toString())
    urlParams.append("total_globos_explotados", results.total_globos_explotados.toString())
    urlParams.append("max_infladas", results.max_infladas.toString())
    urlParams.append("total_puntos", results.total_puntos.toString())

    // Construir URL final
    const separator = baseRedirectUrl.includes("?") ? "&" : "?"
    const finalUrl = `${baseRedirectUrl}${separator}${urlParams.toString()}`

    console.log("Redirigiendo con resultados:", finalUrl)
    window.location.href = finalUrl
  }

  if (gameState === "consent") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-gray-800">Estudio sobre Experiencias Psicológicas y Conductas 2</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Botón desplegable para información */}
              <div>
                <Button
                  onClick={() => setShowInformation(!showInformation)}
                  variant="outline"
                  className="border-blue-300 hover:bg-blue-50 w-full flex items-center justify-between p-4 h-auto whitespace-normal"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Leé acá la información sobre este estudio:
                  </span>
                  {showInformation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>

                {/* Información desplegable */}
                {showInformation && (
                  <div className="mt-4 border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                    <div className="space-y-4 text-sm">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Bienvenido/a</h4>
                        <p className="mb-2">
                           Si sos <strong>mayor de 18 años</strong> y <strong>residís en Argentina</strong>,
                          te invitamos a responder una encuesta poblacional denominada “Estudio sobre Experiencias Psicológicas
                          y Conductas 2” que nuestro grupo de investigación de CONICET y la Universidad Nacional de Córdoba está distribuyendo a través de internet.
                          Nuestro objetivo es identificar qué estados mentales en la población argentina se asocian con el riesgo de violencia. Con este conocimiento,
                          podremos diseñar recomendaciones para disminuir este riesgo.
                        </p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Metodología</h4>
                        <p className="mb-2" >
                          Te pedimos que, de manera <strong>voluntaria</strong>, respondas una serie de preguntas sobre tus experiencias psicológicas, tus conductas habituales en diferentes aspectos de tu vida y tu historia personal, incluidas posibles experiencias de victimización.
                          Responder la encuesta te llevará entre 20 y 40 minutos. Tu participación no conlleva más riesgos que
                          cierta incomodidad al compartir información de carácter personal.
                          Te dejaremos contactos de servicios de salud mental en caso que desees consultar con un profesional.
                        </p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Confidencialidad</h4>
                        <p className="mb-2">
                          No te solicitamos ningún dato que permita tu identificación personal como nombre, apellido o DNI.
                          Tus respuestas sólo se emplearán a los fines de este estudio y se analizarán de manera grupal, así que no será
                          posible conocer respuestas individuales.
                          Es decir que <strong>tus respuestas son</strong> totalmente <strong>confidenciales</strong> y <strong>anónimas</strong>.
                          Podés abandonar la encuesta en cualquier momento. Las respuestas que ya hayas brindado hasta ese momento quedarán guardadas, no pueden retirarse pues no tenemos forma de identificar la identidad de quien responde.
                          Los datos se archivarán de manera segura en una plataforma virtual de la Universidad Nacional de Córdoba con acceso cifrado al que sólo tiene acceso el equipo de investigación.
                          Si querés recibir información sobre tus resultados, al final de la encuesta tendrás la opción de solicitarlo. Este dato será guardado de manera separada, en un documento cifrado, para garantizar tu privacidad.
                        </p>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">Justificación y utilidad de tu participación</h4>
                        <p className="mb-2" >
                          Con tu participación colaborás a mejorar el conocimiento sobre cómo ciertas experiencias psicológicas influyen en la conducta de las personas y, en consecuencia, mejorar la prevención de la violencia y aumentar el bienestar de las personas.
                          No recibirás remuneración ni beneficio alguno por responder esta encuesta.
                          Al dar tu consentimiento informado (ver más abajo), no renunciás a los derechos que te otorga la Ley 25.326 de protección de datos
                          personales. Los resultados del estudio podrán ser difundidos en eventos o publicaciones científicas sin incluir información que
                          permita identificar a los participantes.
                        </p>
                      </div>
                      <div className="bg-orange-50 p-3 sm:p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-3">Contactos</h4>
                        <div className="space-y-4 text-sm">
                          {/* Dudas como participante */}
                          <div>
                            <p className="font-medium  mb-2">Si tenés dudas como participante del estudio podés contactar a:</p>
                            <ul className="ml-4 sm:ml-6 space-y-1">
                              <li className="list-disc">
                                <a
                                  href="https://iipsi.psicologia.unc.edu.ar/etica-en-investigacion/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline break-words"
                                >
                                  Comité de Ética del Instituto de Investigaciones Psicológicas (CONICET-UNC)
                                </a>
                              </li>
                              <li className="list-disc">
                                Email:{" "}
                                <a
                                  href="mailto:comite.etica.iipsi@psicologia.unc.edu.ar"
                                  className="text-blue-600 hover:text-blue-800 underline break-all"
                                >
                                  comite.etica.iipsi@psicologia.unc.edu.ar
                                </a>
                              </li>
                            </ul>
                          </div>

                          {/* Otras dudas sobre el estudio */}
                          <div>
                            <p className="font-medium mb-2">Si tenés otras dudas sobre este estudio podés contactar a:</p>
                            <ul className="ml-4 sm:ml-6 space-y-3">
                              {/* Investigadora principal */}
                              <li className="list-disc">
                                <div>
                                  <p className="font-medium">Investigadora Principal:</p>
                                  <p>Lic. Carolina Rinaldi</p>
                                  <p className="text-xs text-gray-600 break-words">
                                    Instituto de Investigaciones Psicológicas, Facultad de Psicología, UNC
                                    <br className="hidden sm:inline" />
                                    <span className="sm:hidden"> </span>
                                    Enfermera Gordillo esquina Enrique Barros s/n, 3er. piso, X5000 Córdoba
                                  </p>
                                  <p className="break-all">
                                    Email:{" "}
                                    <a
                                      href="mailto:carolina.rinaldi@mi.unc.edu.ar"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      carolina.rinaldi@mi.unc.edu.ar
                                    </a>
                                  </p>
                                </div>
                              </li>

                              {/* Investigadora responsable */}
                              <li className="list-disc">
                                <div>
                                  <p className="font-medium">Investigadora Responsable:</p>
                                  <p>Dra. Karin Arbach</p>
                                  <p className="break-all">
                                    Email:{" "}
                                    <a
                                      href="mailto:k_arbach@unc.edu.ar"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      k_arbach@unc.edu.ar
                                    </a>
                                  </p>
                                </div>
                              </li>

                              {/* Soporte técnico */}
                              <li className="list-disc">
                                <div>
                                  <p className="font-medium">Consultas Técnicas sobre la plataforma o su funcionamiento:</p>
                                  <p>Mateo Marañón</p>
                                  <p className="break-all">
                                    Email:{" "}
                                    <a
                                      href="mailto:mateo.maranon@mi.unc.edu.ar"
                                      className="text-blue-600 hover:text-blue-800 underline"
                                    >
                                      mateo.maranon@mi.unc.edu.ar
                                    </a>
                                  </p>
                                </div>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      {/* <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Contactos</h4>
                        <div className="space-y-3 text-sm">
                          <ul className="list-disc list-inside space-y-1">
                            <li>
                              Si tenés dudas como participante del estudio, podés contactar al  <a
                                href="https://iipsi.psicologia.unc.edu.ar/etica-en-investigacion/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 underline break-all"
                              >
                                Comité de Ética del Instituto de Investigaciones Psicológicas (CONICET-UNC)
                              </a> que aprobó esta encuesta,
                              <a
                                href="mailto:k_arbach@unc.edu.ar"
                                className="text-blue-600 hover:text-blue-800 underline ml-1 break-all"
                              >
                                comite.etica.iipsi@psicología.unc.edu.ar.
                              </a>
                            </li>
                            <li>
                              Si tenés otras dudas sobre este estudio, podés contactar a la investigadora principal: Lic. Carolina Rinaldi
                              (Instituto de  Investigaciones Psicológicas, Facultad de Psicología, UNC; Enfermera Gordillo esquina Enrique Barros s/n,
                              3.er piso, X5000 Córdoba;<a
                                href="mailto:carolina.rinaldi@mi.unc.edu.ar"
                                className="text-blue-600 hover:text-blue-800 underline ml-1 break-all"
                              >
                                carolina.rinaldi@mi.unc.edu.ar
                              </a>); o
                              con la investigadora responsable: Dra. Karin Arbach;<a
                                href="mailto:k_arbach@unc.edu.ar"
                                className="text-blue-600 hover:text-blue-800 underline ml-1 break-all"
                              >
                                k_arbach@unc.edu.ar
                              </a>
                              .
                              Para consultas técnicas sobre la plataforma o su funcionamiento, podés contactar al Técnico
                              en Informática de este estudio: Mateo Marañón;<a
                                href="mailto:mateo.maranon@mi.unc.edu.ar"
                                className="text-blue-600 hover:text-blue-800 underline ml-1 break-all"
                              >
                                mateo.maranon@mi.unc.edu.ar
                              </a>.
                            </li>
                          </ul>


                        </div>
                      </div> */}
                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">Si requerís atención en salud mental, podés contactar a:</h4>
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          <li>
                            Línea nacional gratuita de urgencias en salud mental (Hospital Bonaparte): 0800 999 0091.
                          </li>
                          <li>
                            Línea nacional gratuita de violencia familiar, sexual y/o grooming (Ministerio de Justicia de la Nación): 137 (marcar opción 1).
                          </li>
                        </ul>
                      </div>

                    </div>
                  </div>
                )}
              </div>

              {/* Consentimiento Informado - Siempre visible */}
              <Card className="border-2 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-xl font-bold text-gray-800">Consentimiento Informado</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p><strong>¿Aceptás participar de este estudio?</strong></p>
                    <br />
                    <p className="mb-3">Al aceptar indicás que:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Sos mayor de 18 años y residís en Argentina.</li>
                      <li>Leíste de manera completa la información del estudio provista más arriba.</li>
                      <li>Estás de acuerdo con todas las condiciones de tu participación.</li>
                    </ul>
                  </div>
                  <div className="text-center">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => handleConsent(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Acepto
                      </Button>

                      <Button
                        onClick={() => handleConsent(false)}
                        variant="outline"
                        className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                        size="lg"
                      >
                        <XCircle className="w-5 h-5" />
                        No acepto
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card >
          {/* Logos institucionales */}
          < CardHeader >
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
                <div className="flex flex-col items-center">
                  <img src="/images/logo-conicet.png" alt="CONICET" className="h-16 md:h-20 object-contain" />
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src="/images/unc-logo.jpg"
                    alt="Universidad Nacional de Córdoba - UNC"
                    className="h-16 md:h-20 object-contain"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src="/images/logo-iipsi.png"
                    alt="Instituto de Investigaciones Psicológicas - IIPSI"
                    className="h-16 md:h-20 object-contain"
                  />
                </div>
                <div className="flex flex-col items-center">
                  <img
                    src="/images/logo-eepsic.png"
                    alt="EEPSIC Argentina"
                    className="h-16 md:h-20 object-contain"
                  />
                </div>
              </div>
            </div>
          </CardHeader >
        </div >
      </div >
    )
  }

  if (gameState === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-800">
                JUEGO DEL GLOBO 🎈
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  <Info className="inline w-5 h-5 mr-2" />
                  Instrucciones
                </h3>
                <p className="mb-2">Verás <strong>5 globos</strong>, uno a la vez. Tu objetivo es acumular la mayor cantidad de puntos posible.</p>
                <p className="mb-2">🔎<strong>¿Cómo funciona?</strong></p>
                <ul className="list-disc list-inside space-y-2 text-sm mb-2">
                  <li className="text-justify">Cada vez que hagas clic en <strong>“Inflar Globo”</strong>, ganarás <strong>5 puntos</strong>.</li>
                  <li className="text-justify">
                    Podés inflar el globo tantas veces como quieras para acumular más puntos.
                  </li>
                  <li className="text-justify">
                    Cuando decidas guardar tus puntos, hacé clic en <strong>“Cobrar Puntos”</strong>. Esto sumará los puntos de ese globo a tu <strong>“Total acumulado”</strong> y pasarás al siguiente globo.
                  </li>
                </ul>
                <p className="mb-2">⚠️ <strong>¡Cuidado!</strong></p>
                <ul className="list-disc list-inside space-y-2 text-sm mb-5">
                  <li className="text-justify">
                    El globo puede <strong>explotar</strong> en cualquier momento mientras lo inflás.
                  </li>
                  <li className="text-justify">
                    Si el globo explota antes de que cobres los puntos, perderás todos los puntos acumulados de ese globo. 
                  </li>
                  <li className="text-justify">
                    El punto de explosión es aleatorio y diferente para cada globo.
                  </li>
                </ul>
                <p className="mb-2">➡️ 💎 Completá toda la encuesta para conocer <strong>tu desempeño final en el juego 🪞😏</strong>.</p>
              </div>

              <div className="flex justify-center">
                <Button onClick={startGame} className="flex items-center gap-2" size="lg">
                  <Play className="w-4 h-4" />
                  Comenzar Juego
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === "results") {
    const results = calculateResults()

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-green-800">¡Juego Completado!</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-green-800">{results.total_puntos} puntos</div>
                  <div className="text-sm text-green-600">Total Ganado</div>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg text-center">
                  <div className="text-2xl font-bold text-blue-800">{results.total_globos_explotados}</div>
                  <div className="text-sm text-blue-600">Globos Explotados</div>
                </div>
              </div>

              {/* Countdown y botón de redirección */}
              <div className="bg-blue-50 p-4 rounded-lg text-center">
                <div className="text-sm text-blue-600 mb-2">
                  Serás redirigido automáticamente en {countdown} segundos
                </div>
                <div className="text-xs text-blue-500 mb-2">
                  Los resultados se enviarán automáticamente con la redirección
                </div>
                <div className="w-full bg-blue-200 rounded-full h-2 mb-4">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ width: `${((3 - countdown) / 3) * 100}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button onClick={handleReturnToSurvey} className="flex items-center gap-2 w-full">
                  <span>➡️</span>
                  Continuar a la Encuesta
                </Button>
              </div>

              {/* Información de debug (solo visible en desarrollo) */}
              {process.env.NODE_ENV === "development" && (
                <div className="bg-gray-100 p-3 rounded-lg text-xs">
                  <strong>Debug Info:</strong>
                  <br />
                  Consentimiento: {consentAccepted ? "Aceptado" : "Rechazado"}
                  <br />
                  Promedio ajustado: {results.promedio_ajustado}
                  <br />
                  Promedio no ajustado: {results.promedio_no_ajustado}
                  <br />
                  Globos explotados: {results.total_globos_explotados}
                  <br />
                  Máx infladas: {results.max_infladas}
                  <br />
                  Total puntos: {results.total_puntos}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-4">
      <div className="max-w-md mx-auto">
        {/* Header con información del juego */}
        <Card className="mb-4">
          <CardContent className="p-4">
            <div className="flex justify-between items-center mb-2">
              <Badge variant="secondary">Globo {currentBalloon} de 5</Badge>
              <Badge variant="outline">Completados: {completedBalloons}</Badge>
            </div>
            <div style={{ textAlign: "center" }} >
              <div>
                <span className="text-gray-600">Total acumulado:</span>
                <div className="font-semibold text-green-600">{totalPoints} puntos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Área del globo */}
        <Card className="mb-4">
          <CardContent className="p-8 text-center">
            <div className="relative flex justify-center items-center h-64">
              {isExploding ? (
                <div className="text-6xl animate-pulse">💥</div>
              ) : showSuccess ? (
                <div className="text-4xl animate-bounce">✅</div>
              ) : (
                <div
                  className={`balloon transition-all duration-300 ${currentInflations > 0 ? "animate-pulse" : ""}`}
                  style={{
                    width: `${getBalloonSize()}px`,
                    height: `${getBalloonSize() * 1.2}px`, // Más alto que ancho
                    backgroundColor: `hsl(${Math.min(currentInflations * 3, 60)}, 70%, 60%)`,
                    borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%", // Forma de globo
                    border: "3px solid rgba(0,0,0,0.1)",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
                    position: "relative",
                  }}
                >
                  <div
                    className="absolute inset-0 bg-gradient-to-br from-white/30 to-transparent"
                    style={{ borderRadius: "50% 50% 50% 50% / 60% 60% 40% 40%" }}
                  ></div>

                  {/* Nudo del globo */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full"
                    style={{
                      width: `${getBalloonSize() * 0.15}px`,
                      height: `${getBalloonSize() * 0.1}px`,
                      backgroundColor: `hsl(${Math.min(currentInflations * 3, 60)}, 70%, 50%)`,
                      borderRadius: "0 0 50% 50%",
                      border: "2px solid rgba(0,0,0,0.1)",
                    }}
                  ></div>

                  {/* Hilo del globo */}
                  <div
                    className="absolute bottom-0 left-1/2 transform -translate-x-1/2"
                    style={{
                      width: "2px",
                      height: `${getBalloonSize() * 0.3}px`,
                      backgroundColor: "rgba(0,0,0,0.3)",
                      transform: "translateX(-50%) translateY(100%)",
                    }}
                  ></div>
                </div>
              )}
            </div>

            <div className="mt-4 text-lg font-semibold">Inflaciones: {currentInflations}</div>
          </CardContent>
        </Card>

        {/* Botones de control */}
        <div className="space-y-3">
          <Button
            onClick={inflateBalloon}
            disabled={isExploding || showSuccess}
            className="w-full h-12 text-lg"
            size="lg"
          >
            🎈 Inflar Globo
          </Button>

          <Button
            onClick={collectPoints}
            disabled={currentPoints === 0 || isExploding || showSuccess}
            variant="outline"
            className="w-full h-12 text-lg bg-transparent"
            size="lg"
          >
            💰 Cobrar Puntos
          </Button>
        </div>

        {/* Mensajes de estado */}
        {isExploding && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center">
            <div className="text-red-800 font-semibold">¡El globo explotó!</div>
          </div>
        )}

        {showSuccess && (
          <div className="mt-4 p-3 bg-green-100 border border-green-300 rounded-lg text-center">
            <div className="text-green-800 font-semibold">¡Puntos cobrados!</div>
            <div className="text-green-600 text-sm">Ganaste {currentPoints} puntos</div>
          </div>
        )}
      </div>
    </div>
  )
}
