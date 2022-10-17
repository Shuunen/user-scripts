import { check, checksRun } from 'shuutils'
import { cleanTitle } from '../src/saveur-biere-ratings.user'

check('sb clean title A', cleanTitle('Bière de garde'), 'biere de garde')
check('sb clean title B', cleanTitle('Bière de garde (Bière de garde) 2'), 'biere de garde 2')
check('sb clean title C', cleanTitle('Bière de garde 75cl !'), 'biere de garde')
check('sb clean title D', cleanTitle('Bière de garde 75cl ! (Bière de garde) pack de 2 bières'), 'biere de garde')
check('sb clean title E', cleanTitle('Pack Brewdog Elvis Juice - Pack de 12 bières'), 'brewdog elvis juice')
check('sb clean title F', cleanTitle('Brewdog Elvis Juice - Can'), 'brewdog elvis juice')
check('sb clean title G', cleanTitle('Fût 6L Brewdog Punk IPA'), 'brewdog punk ipa')
check('sb clean title H', cleanTitle('Pack 12 Tripel Karmeliet'), 'tripel karmeliet')
check('sb clean title I', cleanTitle('Pack Tripel Karmeliet - 12 bières et 2 verres'), 'tripel karmeliet')
check('sb clean title J', cleanTitle('Bud 25cl'), 'bud')
check('sb clean title K', cleanTitle('Tiny Rebel Cwtch - Can'), 'tiny rebel cwtch')
check('sb clean title L', cleanTitle('Basqueland Imparable IPA - Can'), 'basqueland imparable ipa')

checksRun()
