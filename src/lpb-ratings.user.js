// ==UserScript==
// @name         Le Petit Ballon - Ratings
// @namespace    https://github.com/Shuunen
// @version      1.0.0
// @description  See your ratings when buying
// @author       Romain Racamier-Lafon
// @match        https://www.lepetitballon.com/*
// @require      https://cdn.jsdelivr.net/gh/Shuunen/user-scripts@master/src/utils.js
// @require      https://cdn.jsdelivr.net/npm/fuse.js@6.6.2
// @grant        none
// ==/UserScript==

/* eslint-disable no-magic-numbers */

// @ts-nocheck
/* globals Fuse */

const ratingsCsv = `domaine des bergeonnieres saint nicolas de bourgueil vielles vignes,3.6
fabrice petit brut recoltant manipulant montier en l isle,4.0
domaine jean marc bouley vieilles vignes volnay,3.5
chateau dauzac margaux,4.5
domaine sarrabelle sarro bello gaillac rouge,2.0
las calzadas tinacula,3.0
pasqua vigneti e cantine capitolo 102 organic nero d avola shiraz,3.0
rietsch demoiselle gewurztraminer,4.5
pierre antonin pinot noir,3.0
chateau tour de pez saint estephe,3.7
clos sorian le petit grain collines de la moure,2.5
chateau grand tuillac the brothers castillon cotes de bordeaux,2.5
lavradores de feitoria douro tinto,3.7
tracce bio primitivo,4.5
chateau la grangere don t panic it s organic cuvee rouge,2.0
domaine du clos roca ecceterra rouge,3.0
chateau vincens origine cahors,4.0
villa barcaroli montepulciano d abruzzo,4.0
domaine jean louis bachelet maranges 1er cru la fussiere,4.8
vignobles guillaume guerin eos,4.5
chateau clos du loup rouge,3.8
chateau les rambauds les abeilles bordeaux,3.5
domaine des remizieres cuvee particuliere crozes hermitage rouge,3.2
pierre jean larraque chateau le virou vieilles vignes,3.7
chateau puy d amour coup de foudre cotes de bourg,4.1
nicolas theuriet fixin,4.0
grau des oliviers beaumes de venise,3.8
rare le pinot noir,4.0
chemin des lions grand chemin minervois,4.2
domaine saint laurent gaillac,3.7
ogier les caprices d antoine cotes du rhone rouge,4.5
honoro vera rioja,2.5
philippe jambon une tranche d amour,3.7
mouton cadet bordeaux rouge,2.0
dominio de punctum pablo claro tempranillo,4.5
dominio de punctum sin sulfitos anadidos barrel aged tempranillo,2.5
castiglia pergula colli del limbara,4.6
chateau de la charriere les charmes dessus santenay,3.6
laballe les terres basses rouge,2.5
cantina diomede lama di pietra nero di troia,5.0
chateau malescasse la closerie de malescasse haut medoc,4.0
domaine de la palombiere le mejanelle,4.0
la prade mari secret de fontenille minervois,2.0
chateau de camensac haut medoc,5.0
domaine mathiflo fernand beaumes de venise,3.5
domaine la marche vieilles vignes mercurey rouge,3.5
chateau frances millegrand minervois,4.0
bernard magrez si mon pere savait cotes du roussillon,2.5
la cave les coteaux du rhone jasoun sainte cecile cotes du rhone villages,3.5
rene collet nord sur champagne,4.0
la linda syrah,4.0
las ninas amante cabernet sauvignon merlot,4.5
mas des cabres equinoxe,5.0
saint verny vignobles le pinot noir,3.0
torre delle grazie chianti,4.0
chaume arnaud la piade vinsobres,2.5
i muvrini muscat doux,3.5
ruhlmann cuvee mosaique pinot noir,3.5
la suffrene bandol,3.0
azpilicueta felix azpilicueta crianza,2.0
las ninas amante cabernet sauvignon merlot,4.0
domaine de saint guirons pauillac,2.5
chateau tournebrise lalande de pomerol,3.5
chateau les rambauds les abeilles bordeaux,4.0
clos de los siete clos de los siete,1.5
la linda malbec,3.5
columbia crest grand estates syrah,4.0
matsu el picaro,2.5
chateau vincens origine cahors,3.5
pierre martin morgon cote du py,2.5
chateau pey la tour reserve vieilles vignes bordeaux superieur,3.5
dominio de punctum pablo claro tempranillo,5.0
musita organicum syrah,2.0
domaine clos romane cairanne rouge,4.5
chateau clos du loup le louveteau,2.0
la prade mari conte des garrigues minervois,3.5
villas pere fils l amour en cage pezenas,4.0
rare le pinot noir,4.0
stephane usseglio les amandiers rouge,3.0
chivite le gardeta finca de villatuerta syrah,4.0
bodegas cosme palacio glorioso seleccion especial 100 anos aniversario,4.0
clos de bouard dame de bouard montagne saint emilion,3.0
chateau d arsac margaux,4.0
terra firma winery belsetan garnacha,3.5
alta alella gx,3.5
cave de ribeauville pinot noir rodern,3.5
cave de ribeauville pinot noir organic,2.5
pierre chanau carmenere,3.0
domaine joillot pommard,2.5
proyecto garnachas de espana la garnacha salvaje del moncayo,3.0
chateau monbousquet saint emilion grand cru,4.0
louis cheze pagus luminis condrieu,4.0
domaine d ourea vacqueyras,5.0
cos d estournel g d estournel,4.0
m chapoutier crozes hermitage la petite ruche,3.5
frederic magnien chambolle musigny premier cru coeur de pierres,4.5
tardieu laurent cote rotie,4.5
groupement de producteurs bourgogne aligote,3.0
bader mimeur chateau de chassagne montrachet rouge,4.5
rhonea les pierres du vallat gigondas,4.0
brotte chateauneuf du pape domaine barville rouge,4.0
chateau lafite rothschild carruades de lafite pauillac,4.0
frederic magnien nuits saint georges coeur de roches,3.0
domaine des remizieres cuvee particuliere crozes hermitage rouge,4.0
proyecto garnachas de espana la garnacha salvaje del moncayo,4.0
vina ijalba tempranillo,4.0
chateau de luc les rives,4.0
domaine masse vieilles vignes bourgogne pinot noir,3.0
bodega de bardos romantica crianza,4.0
vina ijalba tempranillo,4.0
chateau de luc les rives,4.0
capuano ferreri vieilles vignes santenay rouge,4.0
labbe et fils brut tradition champagne premier cru,3.0
bodegas cosme palacio glorioso seleccion especial 100 anos aniversario,4.0
chateau sainte barbe bordeaux merlot,2.0
dominio de punctum pablo claro tempranillo,5.0
proelio crianza,4.5
e guigal cotes du rhone rouge,3.5
chateau de marmorieres l homme fracais languedoc,2.0
les roches bleues soleil de brulhie cote de brouilly,4.5
bodegas cosme palacio glorioso seleccion especial 100 anos aniversario,2.5
coppi vinaccero aleatico,1.0
quinta do valdoeiro reserva tinto,1.0
quinta do valdoeiro tinto,2.0
bodegas valdemar conde de valdemar tempranillo,3.0
conti buneis barbera d asti,1.0
domaine nicolas rossignol pommard,4.0
tardieu laurent cote rotie,4.5
maison jean pla le dino cotes catalanes carignan,3.0
bodegas cosme palacio glorioso seleccion especial 100 anos aniversario,4.0
jean de laurere coteaux bourguignons,3.5
famiglia nunzi conti chianti classico,2.0
domaine modat le petit modat amour rouge,3.5
cave st maurice paradigme,2.0
hegarty chamans no 3 la piboule,2.0
pago de cirsus cuvee especial red blend,5.0
singla la matine rouge,2.0
santa rita secret reserve carmenere,5.0
menhir pietra susumaniello,4.0
luis canas crianza,3.5
chateau ollieux romanis cuvee alice corbieres,4.0
borie de maurel esprit d automne minervois,4.5
domaine de la coste moynier terres des brus merlot,3.5
lenz moser spatlese lieblich,3.5
flat lake top limitation gold,1.0
conte di campiano nero di troia,3.0
las ninas mitica premium,4.0
chateau saint martin de la garrigue vieilles vignes,3.5
domaine machard de gramont nuits saint george en la perriere noblot,5.0
pessegueiro aluze tinto,2.5
domaine de la choupette chassagne montrachet 1er cru morgeot rouge,4.5
chambeyron syrah,4.0
chateau desmirail margaux,3.0
les jamelles mourvedre,4.0
jean luc colombo cornas les mejeans,3.0
lingot martin cerdon classic,4.0
domaine bousquet reserve malbec,2.5
don vincenzo eghemon passimiento,3.0
pago de cirsus seleccion privada,4.5
velenosi querciantica lacrima di morro,4.5
cimarosa bold spicy shiraz,3.5
chateau malijay opus de malijay plan de dieu,2.0
hacienda del carche infiltrado tinto,4.0
lecomte chateaumeillant rouge,1.5
chateau les amoureuses cotes du rhone rouge,2.5
domaine bousquet hunuc malbec organic wine,2.0
domaine du bosc marselan,3.5
chateau kefraya les arcanes rouge,3.0
francois bracoud les bonnivieres cote rotie,5.0
chateau de maison neuve montagne saint emilion,4.0
chaume arnaud marselan,4.5
domaine ruet voujon brouilly,3.0
vincent goesel cremant d alsace brut rose,1.0
cornelien loupiac,3.5
brotte chateauneuf du pape les hauts de barville blanc,3.5
jean desvignes la croix des celestins brouilly,3.0
cimarosa cabernet sauvignon,2.0
produit de france cotes du rhone,4.0
cellier de monterail chateauneuf du pape,4.5
domaine roland schmitt pinot gris alsace grand cru altenberg de bergbieten,4.0
baturrica gran reserva,4.0
collin bourisset beaujolais,4.0
terres nouvelles blaye cotes de bordeaux,1.5
coeur de muscat vin mousseux de qualite aromatique rose,4.0
terres authentiques bordeaux superieur,2.0
souple et fruite alsace pinot noir,4.0
demilly de baere cuvee pure champagne,2.0
marcel deiss alsace grand cru schoenenbourg,4.5
haussmann baron eugene bordeaux superieur,3.5
la castellina il nero di poggio alla buca,4.0
la castellina tommaso bojola chianti classico riserva,4.0
domaine richaud cotes du rhone villages cairanne,4.0
domaine des girasols cuvee celeste,4.0
bestheim cremant d alsace grand prestige,4.0
domaine bader riesling,3.5
domaine binet jacquet reserve faugeres,4.5
gran passione rosso veneto,4.5
baron de ley rioja reserva,4.0
chateau marquis de terme margaux,4.5
chateau haut tropchaud cuvee anthologie pomerol,4.5
domaine brazey et fils vieilles vignes pommard 1er cru la chaniere,3.5
marques de caceres rioja crianza,1.5
springfontein wine estate ulumbaza red,4.5
leyenda carmenere,4.0
zonin valpolicella ripasso superiore,4.0
jean luc colombo cornas la roche,4.0
frederic magnien gevrey chambertin coeur de fer,4.5
vignobles raymond nos racines bordeaux rouge,4.5
chateau bernardin blaye cotes de bordeaux,4.5
chateau marquis de terme margaux,4.5
chateau peybonhomme les tours quintessence de peybonhomme cotes de blaye,1.5
chateau malijay mistral gourmand cotes du rhone rouge,4.5
chateau les amoureuses coteaux de l ardeche grenache,4.0
chateau petit sonnailler cuvee prestige rouge,4.0
lar de paula rioja,4.0
las ninas cabernet sauvignon,4.0
les hauts de sainte cecile bordeaux,1.0
maison ventenac les hauts de ventenac cuvee jules cabardes,4.0
kuentz bas trois chateaux pinot noir,5.0
domaine brazey et fils vieilles vignes pommard 1er cru la chaniere,3.5
francoise bedel origin elle champagne,4.5
rodolphe demougeot pommard,3.5
vignerons de caractere domaine de la maurelle gigondas,3.0
chateau canon la gaffeliere saint emilion grand cru,4.0
domaine des amphores cuvee saint joseph,4.5
chateau mont redon vignoble abeille chateauneuf du pape,3.0
casa ferreirinha esteva douro,2.0
tardieu laurent crozes hermitage,4.5
vins cognard la vinee saint nicolas de bourgueil,4.0
tall horse pinotage,3.5
brotte cotes du rhone esprit barville rouge,2.5
yves cuilleron syrah les vignes d a cote,4.0
malbec syrah mendoza,4.0
chateau vermont reserve,1.0
madirazza dingac,4.0
mas du soleilla bringairet,4.5
zoulou tentation cinsault pinotage,2.0
marcel deiss engelgarten le jardin des anges,4.5
gran passione rosso veneto,4.5
chateau memoires bordeaux rouge,3.5
domaine des nugues fleurie,1.5
vinus reserve mourvedre,3.5
sa trilles domaine des pradines cotes du rhone,4.5
chateau meyney saint estephe,4.0
domaine lafage bastide miraflors vieilles vignes syrah grenache,5.0
domaine lafage bastide miraflors vieilles vignes syrah grenache,5.0
chateau lafleur grangeneuve pomerol,2.0
clos saint joseph muscat sec,5.0
chateau ksara reserve du couvent,4.0
villa degli olmi baglio al sole primitivo,1.0
tall horse pinotage,3.5
bodega atamisque catalpa malbec,4.0
marianne okoma cape red,3.5
chateau rauzan gassies margaux,4.0
domaine berthaut gerbet gevrey chambertin,4.0
navajas rioja tinto,4.5
chateau les miaudoux cotes de bergerac blanc,3.5
famille cros pujol les persiennes merlot,2.0
marsilea bobal,4.5
clos des augustins les bambins pic saint loup rouge,3.5
domaine de quissat grains nature,4.5
clos roussely canaille,2.0
chateau jonc blanc les sens du fruit,3.5
melaric billes de roche saumur,2.0
chateau haut bages liberal pauillac,4.0
domaine berthaut gerbet fixin les crais,3.0
laudun chusclan  terra vitae cotes du rhone villages laudun rouge,4.0
marcel deiss burg,4.0
francois bracoud les bonnivieres cote rotie,4.0
domaine lafage bastide miraflors vieilles vignes syrah grenache,5.0
domaine des chers vieilles vignes julienas,4.0
pasquier desvignes beaujolais villages nouveau,3.5
archer s point cabernet sauvignon,3.5
devil s lair valley of the giants cabernet merlot,3.0
georges vigouroux antisto mendoza,5.0
hardys stamp shiraz cabernet sauvignon,3.0
frederic magnien pinot noir bourgogne,4.0
mas amiel promesse cotes du roussillon villages,1.0
eric rominger pinot noir,4.0
wolfberger gewurztraminer alsace vieilles vignes,4.0
chateau giscours chateau giscours,5.0
melaric le tandem,4.0
les freres muzard santenay premier cru,5.0
chateau micalet haut medoc,4.0
landron chartier revelation malvoisie coteaux d ancenis,4.0
domaine de bellevue champ des cailloux,2.0
majnoni guicciardini chianti,4.0
piccini gran prugnello toscana,3.5
domaine rose dieu cotes du rhone villages plan de dieu,4.0
jean francois reaud du moulin preluve,3.0
stellenrust kleine rust chenin blanc sauvignon blanc,3.0
univitis le marquis de sainte croix bordeaux,3.0
chateau ollieux romanis corbieres rouge,3.5
bodega atamisque serbal malbec,4.0
pech de jammes malbec,4.5
les freres muzard santenay premier cru,4.0
sella mosca cannonau di sardegna,4.0
domaine de l eglantine morgon,4.0
yvon mau chateau verisse cuvee de la croix loupiac,4.0
chateau bovila malbec cahors,1.0
jean loron domaine des billards saint amour,3.5
duca di sasseta chieteno toscana,3.5
duca di saragnano l opera,2.5
domaine de la tour vin de glace pinot gris,2.0
le vigneau semillon sauvignon blanc sec,4.0
joostenberg family blend white,4.0
chateau la gaffeliere saint emilion grand cru,4.0
marrenon orca vieilles vignes,3.0
clos du clocher esprit de clocher pomerol,2.0
chateau de mercues grand vin seigneur,4.0
chateau giscours la sirene de giscours margaux,3.0
chateau haut grelot blaye cotes de bordeaux rouge,4.0
vetroz syrah,5.0
levratiere morgon,4.0
sizanani cabernet sauvignon,4.0
hubert krick les hesperides pinot gris,4.5
mas amiel pur schiste,3.0
chateau revelette coteaux d aix en provence rouge,1.0
jean lissague petit secret rouge,2.0
meix guillaume mercurey vin de bourgogne,3.5
mas amiel prestige 15 ans d age,5.0
cj jacopit chateau tropchaud l eglise pomerol,1.5
chateau du cros chateau haut mayne graves blanc,2.5
chateau soucherie carmen rouge,1.5
chateau lamothe vincent heritage rouge,4.0
capdevielle chateau l eveche bordeaux origami rouge,2.5
delas viognier vin de pays d oc selection,2.0
mission cahors,3.5
domaine des amphores cuvee saint joseph,4.0
les vignerons de buzet baron d albret,3.0
gerard bertrand autrement merlot,1.5
chateau clos du loup cuvee tradition blaye cotes de bordeaux,3.5
chateau plaisance cuvee alix cotes de bordeaux,1.0
le cellier du pic reserve les almades pic saint loup rouge,4.0
mas amiel vintage,2.0
domaine debray pommard 1er cru les epenots,4.5
georges vigouroux chateau de haute serre malbec,3.5
pech de jammes petit jammes cahors malbec,4.0
chateau lafon la tuilerie saint emilion grand cru,4.0
philippe de bois d arnault les grands champs savigny les beaune,3.5
el angosto la pena de espana red,4.5
stephane murat bourgogne hautes cotes de nuits,2.0
domaine du tariquet cotes de gascogne premieres grives,3.0
chateau clare graves,1.0
chateau haut tropchaud pomerol,4.0
le roc le classique fronton,2.5
anne de joyeuse camas merlot,1.0
chateau d oupia les barons minervois,2.5
chateau lamothe vincent merlot bordeaux,3.5
chateau lynch moussas les hauts de lynch moussas haut medoc,4.0
tarani millesime rouge,4.0
chateau bourdieu no 1,2.0
domaine la guintrandy cotes du rhone rose,3.0
luis canas rioja gran reserva,3.5
domaine berthaut gerbet fixin,2.0
cave des vignerons de frontignan chorus muscat moelleux,4.0
cono sur bicicleta reserva carmenere,3.5
la bastide saint vincent florentin cotes du rhone villages plan de dieu,3.5
la cave d augustin florent ventoux,1.0
e guigal cote rotie brune blonde de guigal,4.5
chateau grand puy lacoste lacoste borie pauillac,5.0
bernard magrez casa magrez de uruguay,2.0
corsican mulinu di rasignani muscat naturellement doux,3.5
antonini dell arca primitivo salento,3.0
altos ibericos crianza,3.5
gallo family vineyards merlot,3.0
chateau clinet ronan by clinet bordeaux,4.0
chateau courac cotes du rhone villages laudun,4.0
freixenet cava cordon negro brut,4.0
emiliana coyam,4.0
vignobles chatelier chateau cantelaudette cuvee prestige graves de vayres,2.5
calendal plan de dieu,2.5
vignerons de tautavel vingrau le cirque rouge,3.5
chateau grand puy lacoste lacoste borie pauillac,5.0
mouton cadet bordeaux rouge,3.0
la prade mari gourmandise des bois,2.5
chateau saint ahon haut medoc,4.0
gallo family vineyards summer red,1.0
chateau lynch bages pauillac,4.0
san pedro gato negro rose,1.0`


/**
 * Clean a title string
 * @param {string} title The title to clean
 * @returns {string} The cleaned title
 */
function cleanTitle (title) {
  return title
    .replace(/\([^(]+\)/gu, ' ') // remove parenthesis content(s)
    .replace(/\d{4}/gu, ' ') // remove year
    .replace(/['’-]/gu, ' ').normalize('NFD').replace(/[^\d\sa-z]/giu, '').toLowerCase() // from shuutils sanitize
    .replace(/\b(?:chateau|clos|cuvee|de|domaine|du|la|le|maison|vini)s?\b/gu, ' ') // remove common words
    .replace(/\s+/gu, ' ')
    .trim()
}

const ratings = ratingsCsv.split('\n').map((line) => {
  const [title, rating] = line.split(',')
  return {
    rating: Number.parseFloat(rating, 10),
    title: cleanTitle(title),
  }
})

// eslint-disable-next-line max-statements
function createReview (name, rating) {
  const review = document.createElement('div')
  review.classList.add('my-review')
  review.style.width = `${Math.max(rating / 5 * 100, 20)}%` // 5 stars will be 100% width
  review.style.height = `${12}px`
  review.style.margin = '2px 0'
  review.style.borderRadius = `${5}px`
  review.style.backgroundColor = 'red'
  review.style.backgroundImage = 'url("https://i.pinimg.com/originals/d5/a7/cb/d5a7cb46e2f15a8fed10aaf1dd00965c.gif")'
  review.style.backgroundBlendMode = 'color-dodge'
  review.style.backgroundSize = '16px'
  if (rating >= 3) review.style.backgroundColor = 'orange'
  if (rating >= 4) review.style.backgroundColor = 'green'
  review.title = `"${name}" rated ${rating} stars`
  return review
}

// eslint-disable-next-line max-statements
function lePetitBallonRatings () {
  if (typeof window === 'undefined') return
  const fuseSettings = {
    includeScore: true, // eslint-disable-line @typescript-eslint/naming-convention
    keys: ['title'],
    minMatchCharLength: 4,
    threshold: 0.4,
  }
  const fuse = new Fuse(ratings, fuseSettings)
  /** @type {import('./utils.js').Shuutils} */// @ts-ignore
  const utils = new Shuutils('lpb-ratings')
  const selectors = {
    items: `.product-item:not(.${utils.id})`,
    useless: '.product-catalog--out-stock, .footer-trustpilot, .footer-legal',
    wineTitle: '.product-catalog__title',
  }
  function hideUseless () {
    utils.findAll(selectors.useless, document, true).forEach(node => {
      // eslint-disable-next-line no-param-reassign
      if (utils.app.debug) node.style = 'background-color: red !important;color: white !important; box-shadow: 0 0 10px red;'
      // eslint-disable-next-line no-param-reassign
      else node.style.display = 'none'
    })
  }

  function searchRating (wine = '') {
    const results = fuse.search(wine)
    if (results.length === 0) return { isMatching: false }
    const [result] = results
    const percent = 100 - Math.round(result.score * 100)
    if (percent < 50) return { isMatching: false }
    const { rating = 0, title = '' } = result.item
    if (wine.includes('rouge') && title.includes('blanc')) return { isMatching: false }
    if (wine.includes('blanc') && title.includes('rouge')) return { isMatching: false }
    return { isMatching: true, percent, rating, search: wine, title }
  }

  // eslint-disable-next-line max-statements
  function injectRating (item) {
    item.classList.add(utils.id)
    const title = utils.findOne(selectors.wineTitle, item, true)
    if (!title) { utils.error('no title found on item', item); return }
    const domain = title.nextElementSibling
    // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
    const wine = cleanTitle(`${domain.textContent} ${title.textContent}`)
    const result = searchRating(wine)
    if (!result.isMatching) return
    utils.log('found', result)
    title.prepend(createReview(result.title, result.rating))
  }

  function injectRatings () {
    utils.findAll(selectors.items).forEach((item) => {
      injectRating(item)
    })
  }
  async function init () {
    const items = await utils.waitToDetect(selectors.items)
    if (items === undefined) { utils.log('no item found on this page'); return }
    hideUseless()
    injectRatings()
  }
  const injectRatingsDebounced = utils.debounce(injectRatings, 500)
  void utils.onPageChange(init)
  window.addEventListener('DOMNodeInserted', () => injectRatingsDebounced())
}

lePetitBallonRatings()

if (module) module.exports = {
  cleanTitle,
}
