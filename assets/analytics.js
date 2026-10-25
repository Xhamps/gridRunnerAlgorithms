// PostHog: pageviews + autocapture of clicks. Loaded right after github.js on every page.
(() => {
  const KEY = 'phc_sXfNwZXsHUrVTdEPuqtJCkVr4WLn2BfnR6MaX5VSHhLz', HOST = 'https://us.i.posthog.com';
  // ponytail: skip local dev so it doesn't pollute the data
  if (['localhost', '127.0.0.1', ''].includes(location.hostname)) return;
  !function(t,e){var o,n,p,r;e.__SV||(window.posthog=e,e._i=[],e.init=function(i,s,a){function g(t,e){var o=e.split(".");2==o.length&&(t=t[o[0]],e=o[1]),t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}}(p=t.createElement("script")).type="text/javascript",p.crossOrigin="anonymous",p.async=!0,p.src=s.api_host.replace(".i.posthog.com","-assets.i.posthog.com")+"/static/array.js",(r=t.getElementsByTagName("script")[0]).parentNode.insertBefore(p,r);var u=e;for(void 0!==a?u=e[a]=[]:a="posthog",u.people=u.people||[],u.toString=function(t){var e="posthog";return"posthog"!==a&&(e+="."+a),t||(e+=" (stub)"),e},u.people.toString=function(){return u.toString(1)+".people (stub)"},o="init capture register register_once unregister identify alias reset get_distinct_id set_config opt_in_capturing opt_out_capturing has_opted_out_capturing".split(" "),n=0;n<o.length;n++)g(u,o[n]);e._i.push([i,s,a])},e.__SV=1)}(document,window.posthog||[]);
  posthog.init(KEY, { api_host: HOST, person_profiles: 'identified_only' });
})();
