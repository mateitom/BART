"use client"

import React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Play, Info, CheckCircle, XCircle, ChevronDown, ChevronUp, ExternalLink } from "lucide-react"

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
    if (currentBalloon >= 10) {
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
      const baseRedirectUrl = "https://encuestas3.unc.edu.ar/index.php?r=survey/index&sid=892672&newtest=Y&lang=es"
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

  const [countdown, setCountdown] = React.useState(3)
  const [baseRedirectUrl] = React.useState(
    "https://encuestas3.unc.edu.ar/index.php?r=survey/index&sid=892672&newtest=Y&lang=es",
  ) // CAMBIAR ESTE LINK

  React.useEffect(() => {
    if (gameState !== "results") return

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
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
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [gameState, baseRedirectUrl, consentAccepted])

  React.useEffect(() => {
    if (gameState === "results") {
      setCountdown(3)
    }
  }, [gameState])

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
              <CardTitle className="text-2xl font-bold text-gray-800">EEPSIC 2</CardTitle>
              <CardTitle className="text-2xl font-bold text-gray-800">Términos y Condiciones</CardTitle>

              {/* Logos institucionales */}
              <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap justify-center items-center gap-6 md:gap-8">
                  <div className="flex flex-col items-center">
                    <img
                      src="/images/logo-iipsi.png"
                      alt="Instituto de Investigaciones Psicológicas - IIPSI"
                      className="h-16 md:h-20 object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <img
                      src="/images/unc-logo.jpg"
                      alt="Universidad Nacional de Córdoba - UNC"
                      className="h-16 md:h-20 object-contain"
                    />
                  </div>
                  <div className="flex flex-col items-center">
                    <img src="/images/logo-conicet.jpeg" alt="CONICET" className="h-16 md:h-20 object-contain" />
                  </div>
                  <div className="flex flex-col items-center">
                    <img src="/images/logo-eepsic.png" alt="EEPSIC Argentina" className="h-20 md:h-24 object-contain" />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Botón desplegable para información */}
              <div>
                <Button
                  onClick={() => setShowInformation(!showInformation)}
                  variant="outline"
                  className="w-full flex items-center justify-between p-4 h-auto"
                >
                  <span className="flex items-center gap-2">
                    <Info className="w-5 h-5" />
                    Ver Ficha de Información
                  </span>
                  {showInformation ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </Button>

                {/* Información desplegable */}
                {showInformation && (
                  <div className="mt-4 border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                    <h3 className="text-xl font-semibold text-gray-800 mb-4">Información</h3>

                    <div className="space-y-4 text-sm">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-blue-800 mb-2">Información sobre salud mental</h4>
                        <p className="mb-2">
                          Dado que el estudio trata temas que pueden resultar sensibles, te informamos que en caso de
                          sentirte incómodo/a o necesitar apoyo psicológico, podés recurrir a los siguientes recursos de
                          atención en salud mental:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>
                            Si te encontrás en la Provincia de Córdoba, podés consultar los siguientes enlaces para
                            obtener más información sobre los servicios disponibles en salud mental:
                            <ul className="list-disc list-inside ml-4 mt-1">
                              <li>
                                <a
                                  href="https://www.cba.gov.ar/direccion-de-salud-mental/"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1"
                                >
                                  Dirección de Salud Mental - Gobierno de Córdoba
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              </li>
                              <li>Material de difusión - Secretaría de Salud Mental</li>
                            </ul>
                          </li>
                          <li>
                            Si residís en otra provincia de Argentina, te recomendamos visitar la página del Ministerio
                            de Salud correspondiente a tu localidad o acercarte al centro de salud más cercano. También
                            podés consultar la Línea Nacional de Salud Mental a través del número 0800-345-1435 o su
                            página web:
                            <a
                              href="https://www.argentina.gob.ar/salud/"
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 underline inline-flex items-center gap-1 ml-1"
                            >
                              https://www.argentina.gob.ar/salud/
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </li>
                        </ul>
                      </div>

                      <div className="bg-red-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-red-800 mb-2">Líneas de asistencia en violencia de género</h4>
                        <p className="mb-2">
                          En caso de estar atravesando una situación de violencia de género, te informamos que podés
                          acceder a la siguiente línea de asistencia:
                        </p>
                        <ul className="list-disc list-inside ml-4">
                          <li>
                            <strong>Línea 144:</strong> Asesoramiento y contención para situaciones de violencia de
                            género. Disponible las 24 horas todos los días del año.
                          </li>
                        </ul>
                      </div>

                      <div className="bg-green-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-green-800 mb-2">Información importante</h4>
                        <p>
                          Si residís en Argentina y tenés más de 18 años, sos invitado/a a participar en una encuesta en
                          línea relacionada con creencias, ideas y conductas que algunas personas pueden experimentar.
                          La investigación tiene como objetivo profundizar en el conocimiento de experiencias
                          psicológicas que pueden influir en el bienestar integral de las personas. Este estudio está
                          coordinado por el Grupo de Investigación en Violencia del Instituto de Investigaciones
                          Psicológicas (IIPSI - UNC - CONICET).
                        </p>
                      </div>

                      <div className="bg-purple-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-purple-800 mb-2">Objetivos del estudio</h4>
                        <p>
                          El estudio tiene como objetivo explorar cómo algunos estados mentales complejos se relacionan
                          con la violencia. En la encuesta se te harán preguntas sobre temas delicados que incluyen
                          experiencias de violencia. Se te preguntará acerca de tu historia personal, creencias,
                          emociones y situaciones en las que hayas experimentado violencia. Si en algún momento las
                          preguntas te resultan demasiado incómodas, podrás suspender tu participación sin ningún tipo
                          de penalización. El propósito de estas preguntas es contribuir a la comprensión de las
                          relaciones entre estados mentales complejos y la violencia para mejorar el tratamiento y apoyo
                          a las personas afectadas por estos problemas.
                        </p>
                      </div>

                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-yellow-800 mb-2">Duración y confidencialidad</h4>
                        <p>
                          Te pedimos que completes la encuesta en una sola sesión, la cual tomará aproximadamente 45
                          minutos. Todos los datos que nos proporciones serán tratados de manera confidencial y
                          almacenados de forma segura. La información recopilada no incluirá tu nombre, fecha de
                          nacimiento, ni otro dato que permita identificarte personalmente. Las respuestas anónimas sólo
                          serán accesibles a través del correo institucional de la investigadora principal del estudio,
                          y se procesarán de manera grupal para garantizar el anonimato. Si deseas recibir publicaciones
                          relacionadas con este estudio, podrás dejar tu correo electrónico al final de la encuesta.
                          Este dato será guardado de manera separada, en un documento cifrado, para garantizar tu
                          privacidad.
                        </p>
                      </div>

                      <div className="bg-orange-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-orange-800 mb-2">Riesgos y suspensión de participación</h4>
                        <p>
                          Este estudio no conlleva riesgos graves, aunque se anticipa que algunas preguntas puedan
                          resultar incómodas o generar malestar debido a la naturaleza sensible de los temas tratados.
                          Podrás interrumpir tu participación en cualquier momento sin necesidad de justificación, y sin
                          que esto te cause ningún perjuicio. Además, si decidís retirar tus datos, podrás hacerlo hasta
                          el momento en que estos sean incluidos en los resultados globales (cuando ya no podrán ser
                          identificados individualmente).
                        </p>
                      </div>

                      <div className="bg-teal-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-teal-800 mb-2">Beneficios y compensación</h4>
                        <p>
                          Con tu participación colaboras a mejorar el conocimiento sobre la forma en que ciertas
                          experiencias psicológicas influyen en la conducta de las personas y, en consecuencia, mejorar
                          la prevención de la violencia y aumentar el bienestar de las personas. No recibirás
                          compensación económica ni de ningún otro tipo por participar en este estudio.
                        </p>
                      </div>

                      <div className="bg-indigo-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-indigo-800 mb-2">Protección de datos</h4>
                        <p className="mb-2">
                          Al dar tu consentimiento informado, no renuncias a ninguno de los derechos que te otorgan las
                          leyes de protección de datos personales en Argentina, particularmente la ley 25.326. Los datos
                          que aportes serán utilizados exclusivamente para fines académicos y científicos. Los
                          resultados del estudio podrán ser presentados o publicados en eventos científicos o artículos,
                          pero no incluirán información que permita identificar a los participantes.
                        </p>
                        <p>
                          Además, si tenés dudas sobre el estudio o necesitas asistencia inmediata, podés comunicarte
                          con la investigadora principal del proyecto, Lic. Carolina Rinaldi, a través de su correo
                          electrónico:
                          <a
                            href="mailto:carolina.rinaldi@mi.unc.edu.ar"
                            className="text-blue-600 hover:text-blue-800 underline ml-1"
                          >
                            carolina.rinaldi@mi.unc.edu.ar
                          </a>
                          ; o con la investigadora responsable del proyecto:
                          <a
                            href="mailto:k_arbach@unc.edu.ar"
                            className="text-blue-600 hover:text-blue-800 underline ml-1"
                          >
                            k_arbach@unc.edu.ar
                          </a>
                        </p>
                      </div>

                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-semibold text-gray-800 mb-2">Contacto del Comité de Ética</h4>
                        <p>
                          Para consultas relacionadas con el diseño del estudio o si deseas realizar alguna pregunta
                          sobre su participación, podés contactar al Comité de Ética que aprobó esta investigación:
                        </p>
                        <p className="mt-1">
                          <strong>Correo electrónico:</strong>
                          <a
                            href="mailto:comite.etica.iipsi@psicología.unc.edu.ar"
                            className="text-blue-600 hover:text-blue-800 underline ml-1"
                          >
                            comite.etica.iipsi@psicología.unc.edu.ar
                          </a>
                        </p>
                        <p className="mt-2 italic">
                          Agradecemos profundamente tu disposición para participar en este estudio y tu tiempo.
                        </p>
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
                    <p className="mb-3">Al aceptar los términos de participación indicás que:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>Sos mayor de 18 años</li>
                      <li>Residís en Argentina</li>
                      <li>Entendés que tu participación es voluntaria y podés retirarte en cualquier momento</li>
                      <li>Aceptás el procedimiento informado</li>
                      <li>Comprendés que no corrés ningún riesgo (conocido o esperado) por participar</li>
                      <li>Entendés que no recibirás remuneración u otros beneficios por participar</li>
                      <li>
                        Aceptás que los resultados se publiquen en reuniones o publicaciones científicas, manteniendo
                        siempre la reserva de los datos personales
                      </li>
                    </ul>
                  </div>

                  <div className="text-center">
                    <p className="mb-4 font-medium">
                      Por favor, indicá si estás de acuerdo o no con los términos de participación:
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => handleConsent(true)}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        size="lg"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Estoy de acuerdo
                      </Button>

                      <Button
                        onClick={() => handleConsent(false)}
                        variant="outline"
                        className="flex items-center gap-2 border-red-300 text-red-600 hover:bg-red-50"
                        size="lg"
                      >
                        <XCircle className="w-5 h-5" />
                        No estoy de acuerdo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (gameState === "instructions") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="max-w-2xl mx-auto">
          <Card className="mt-8">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-800">
                Tarea del Globo Analógico de Riesgo (BART)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">
                  <Info className="inline w-5 h-5 mr-2" />
                  Instrucciones
                </h3>
                <ul className="space-y-2 text-sm">
                  <li>• Verás una serie de 10 globos, uno a la vez</li>
                  <li>• Cada vez que inflés un globo, ganarás 5 puntos </li>
                  <li>• Puedes inflar el globo <strong>tantas veces como quieras</strong></li>
                  <li>• En cualquier momento puedes hacer clic en "Cobrar puntos" para guardar tus ganancias</li>
                  <li>
                    • <strong>¡CUIDADO!</strong> Si el globo explota, perderás todos los puntos de ese globo
                  </li>
                  <li>• Cada globo tiene un <strong>punto de explosión desconocido</strong> y diferente</li>
                  <li>• Tu objetivo es <strong>ganar</strong> la mayor cantidad de <strong>puntos</strong> posible</li>
                </ul>
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
                  <span>🔙</span>
                  Volver a la Encuesta
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
              <Badge variant="secondary">Globo {currentBalloon} de 10</Badge>
              <Badge variant="outline">Completados: {completedBalloons}</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600">Globo actual:</span>
                <div className="font-semibold">{currentPoints} puntos</div>
              </div>
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
            🎈 Inflar Globo (+5 puntos)
          </Button>

          <Button
            onClick={collectPoints}
            disabled={currentPoints === 0 || isExploding || showSuccess}
            variant="outline"
            className="w-full h-12 text-lg bg-transparent"
            size="lg"
          >
            💰 Cobrar Puntos ({currentPoints} puntos)
          </Button>
        </div>

        {/* Mensajes de estado */}
        {isExploding && (
          <div className="mt-4 p-3 bg-red-100 border border-red-300 rounded-lg text-center">
            <div className="text-red-800 font-semibold">¡El globo explotó!</div>
            <div className="text-red-600 text-sm">Perdiste {currentPoints} puntos</div>
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
