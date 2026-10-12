import React from 'react';
import { Link } from 'react-router-dom';
import './SimulationCardsSection.css';

export const SimulationCardsSection: React.FC = () => {
  return (
    <section className="zw-sim-section" aria-label="Zwosmos Interactive Discovery Cards">
      <div className="zw-sim-container">
        <div className="zw-sim-gallery">
          {/* ========================================================================= */}
          {/* Card 1: Zwosmos Interactive (Violet / Purple)                             */}
          {/* ========================================================================= */}
          <article
            className="zw-sim-card"
            data-kind="interactive"
            data-variant="violet"
            aria-labelledby="zw-interactive-title"
          >
            <div className="zw-sim-card__logo" aria-label="Zwosmos">
              <img
                src="/assets/icons/Zwosmos_Logo_Light.svg"
                alt="Zwosmos"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.zw-logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'inline';
                }}
              />
              <span className="zw-logo-fallback" style={{ display: 'none' }}>LOGO</span>
            </div>

            <div className="zw-sim-card__content">
              <p className="zw-sim-card__section">Zwosmos Interactive</p>
              <h2 id="zw-interactive-title">
                <span className="zw-line">Learn with</span>
                <span className="zw-emphasis">interactive</span>
                <span className="zw-line">simulations.</span>
              </h2>
              <p className="zw-sim-card__description">
                Explore space through hands-on simulations.
              </p>
            </div>

            <div className="zw-sim-card__footer">
              <p className="zw-sim-card__offer">Free for a limited period.</p>
              <Link className="zw-sim-card__cta" to="/interactive">
                <span>Launch simulations</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            {/* Concentric Animated Orbits */}
            <svg className="zw-sim-card__orbits" viewBox="0 0 500 625" aria-hidden="true">
              <circle className="zw-sim-card__ring" cx="515" cy="100" r="150" />
              <g data-radius="150" data-centre="515,100">
                <circle className="zw-sim-card__dot--outer" cx="515" cy="-50" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="665" cy="100" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="515" cy="250" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="365" cy="100" r="6" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-55 515 100"
                  to="305 515 100"
                  dur="38s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </g>

              <circle className="zw-sim-card__ring" cx="515" cy="100" r="95" />
              <g data-radius="95" data-centre="515,100">
                <circle className="zw-sim-card__dot--inner" cx="515" cy="5" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="610" cy="100" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="515" cy="195" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="420" cy="100" r="4.5" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-37 515 100"
                  to="323 515 100"
                  dur="57s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </g>
            </svg>
          </article>

          {/* ========================================================================= */}
          {/* Card 2: Skywatching (Yellow)                                              */}
          {/* ========================================================================= */}
          <article
            className="zw-sim-card"
            data-kind="skywatching"
            data-variant="yellow"
            aria-labelledby="zw-skywatching-title"
          >
            <div className="zw-sim-card__logo" aria-label="Zwosmos">
              <img
                src="/assets/icons/Zwosmos_Logo_Dark.svg"
                alt="Zwosmos"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.zw-logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'inline';
                }}
              />
              <span className="zw-logo-fallback" style={{ display: 'none' }}>LOGO</span>
            </div>

            <div className="zw-sim-card__content">
              <p className="zw-sim-card__section">Skywatching</p>
              <h2 id="zw-skywatching-title">
                <span className="zw-line">Your next</span>
                <span className="zw-emphasis">reason to</span>
                <span className="zw-line">look up.</span>
              </h2>
              <p className="zw-sim-card__description">
                Discover what’s visible in the sky and plan your next night under the stars.
              </p>
            </div>

            <div className="zw-sim-card__footer">
              <Link className="zw-sim-card__cta" to="/skywatching">
                <span>Explore the night sky</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            {/* Concentric Animated Orbits */}
            <svg className="zw-sim-card__orbits" viewBox="0 0 500 625" aria-hidden="true">
              <circle className="zw-sim-card__ring" cx="475" cy="600" r="225" />
              <g data-radius="225" data-centre="475,600">
                <circle className="zw-sim-card__dot--outer" cx="475" cy="375" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="700" cy="600" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="475" cy="825" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="250" cy="600" r="6" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-35 475 600"
                  to="325 475 600"
                  dur="46s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </g>

              <circle className="zw-sim-card__ring" cx="475" cy="600" r="150" />
              <g data-radius="150" data-centre="475,600">
                <circle className="zw-sim-card__dot--inner" cx="475" cy="450" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="625" cy="600" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="475" cy="750" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="325" cy="600" r="4.5" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="-17 475 600"
                  to="343 475 600"
                  dur="71s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </g>
            </svg>
          </article>

          {/* ========================================================================= */}
          {/* Card 3: Zwantum Explainers (Charcoal)                                     */}
          {/* ========================================================================= */}
          <article
            className="zw-sim-card"
            data-kind="explainers"
            data-variant="charcoal"
            aria-labelledby="zw-explainers-title"
          >
            <div className="zw-sim-card__logo" aria-label="Zwosmos">
              <img
                src="/assets/icons/Zwosmos_Logo_Light.svg"
                alt="Zwosmos"
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                  const fallback = e.currentTarget.parentElement?.querySelector('.zw-logo-fallback');
                  if (fallback) (fallback as HTMLElement).style.display = 'inline';
                }}
              />
              <span className="zw-logo-fallback" style={{ display: 'none' }}>LOGO</span>
            </div>

            <div className="zw-sim-card__content">
              <p className="zw-sim-card__section">Zwantum Explainers</p>
              <h2 id="zw-explainers-title">
                <span className="zw-line">Big questions.</span>
                <span className="zw-emphasis">Clear</span>
                <span className="zw-line">answers.</span>
              </h2>
              <p className="zw-sim-card__description">
                Understand the science behind space, one idea at a time.
              </p>
            </div>

            <div className="zw-sim-card__footer">
              <Link className="zw-sim-card__cta" to="/explainers">
                <span>Read the explainers</span>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M4 12h15M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>

            {/* Concentric Animated Orbits */}
            <svg className="zw-sim-card__orbits" viewBox="0 0 500 625" aria-hidden="true">
              <circle className="zw-sim-card__ring" cx="30" cy="615" r="195" />
              <g data-radius="195" data-centre="30,615">
                <circle className="zw-sim-card__dot--outer" cx="30" cy="420" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="225" cy="615" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="30" cy="810" r="6" />
                <circle className="zw-sim-card__dot--outer" cx="-165" cy="615" r="6" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="25 30 615"
                  to="385 30 615"
                  dur="54s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </g>

              <circle className="zw-sim-card__ring" cx="30" cy="615" r="125" />
              <g data-radius="125" data-centre="30,615">
                <circle className="zw-sim-card__dot--inner" cx="30" cy="490" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="155" cy="615" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="30" cy="740" r="4.5" />
                <circle className="zw-sim-card__dot--inner" cx="-95" cy="615" r="4.5" />
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="43 30 615"
                  to="403 30 615"
                  dur="82s"
                  repeatCount="indefinite"
                  calcMode="linear"
                />
              </g>
            </svg>
          </article>
        </div>
      </div>
    </section>
  );
};

export default SimulationCardsSection;
