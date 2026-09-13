// ---------------------------------------------------------------
// FooterParticles — fundo animado bem discreto pro rodapé (adaptado
// de um componente do 21st.dev, originalmente feito pra tela cheia
// com Next.js/shadcn — aqui virou algo bem mais sutil e preso só à
// altura do rodapé):
//  • Poucas partículas (25, não 140), devagar, baixa opacidade — é
//    decoração de fundo, não o protagonista da tela.
//  • Sem interação nenhuma no hover/clique — um efeito "puxa/empurra"
//    ao passar o mouse combina com landing page de produto, não com o
//    rodapé de um site de vagas de emprego.
//  • Sem lógica própria de tema escuro: o site inteiro já resolve modo
//    escuro com UM filtro CSS que inverte cores (nv-dark-invert, em
//    index.css) — deixei o canvas seguir essa mesma regra em vez de
//    reimplementar detecção de tema aqui dentro.
//  • pointer-events:none — nunca atrapalha o clique nos links reais do
//    rodapé (Termos, WhatsApp, etc.), mesmo estando por baixo deles.
// ---------------------------------------------------------------

import { useEffect, useId } from "react";

let particlesScriptPromise = null;
function loadParticlesScript() {
  if (window.particlesJS) return Promise.resolve();
  if (!particlesScriptPromise) {
    particlesScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/particles.js/2.0.0/particles.min.js";
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }
  return particlesScriptPromise;
}

export default function FooterParticles() {
  const domId = useId().replace(/:/g, "");

  useEffect(() => {
    let cancelled = false;
    loadParticlesScript().then(() => {
      if (cancelled || !window.particlesJS) return;
      window.particlesJS(domId, {
        particles: {
          number: { value: 30, density: { enable: true, value_area: 900 } },
          color: { value: "#3b82f6" },
          shape: { type: "circle" },
          opacity: { value: 0.45, random: true },
          size: { value: 2.6, random: true },
          line_linked: { enable: true, distance: 140, color: "#3b82f6", opacity: 0.25, width: 1 },
          move: { enable: true, speed: 0.6, random: true, out_mode: "out" },
        },
        // Sem interatividade de propósito — decoração de fundo, não
        // um brinquedo pra mexer.
        interactivity: {
          detect_on: "canvas",
          events: { onhover: { enable: false }, onclick: { enable: false }, resize: true },
        },
        retina_detect: true,
      });
    });
    return () => {
      cancelled = true;
      // @ts-ignore
      const instances = window.pJSDom || [];
      const idx = instances.findIndex((p) => p.pJS?.canvas?.el?.parentElement?.id === domId);
      if (idx !== -1) {
        instances[idx].pJS.fn.vendors.destroypJS();
        instances.splice(idx, 1);
      }
    };
  }, [domId]);

  return <div id={domId} className="pointer-events-none absolute inset-0" aria-hidden="true" />;
}
