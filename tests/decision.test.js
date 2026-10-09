import {describe,it,expect} from 'vitest';
import {decide} from '../src/decision.js';
const lead={requirements:{location:'Dubai Marina',budget_max:2000000,timeline:'30 days'}};
describe('bounded Decision Gate',()=>{
 it('routes complete leads to human review',()=>expect(decide(lead)).toMatchObject({action:'READY_FOR_REVIEW',human_approval_required:true}));
 it('asks for missing budget',()=>expect(decide({requirements:{location:'Dubai',timeline:'soon'}}).action).toBe('ASK'));
 it('hands off invalid budget range',()=>expect(decide({requirements:{location:'Dubai',timeline:'soon',budget_min:1000,budget_max:100}}).action).toBe('HUMAN_HANDOFF'));
 it('never permits autonomous sending',()=>{for(const requirements of [{},{location:'Dubai',budget_min:10,timeline:'now'}])expect(decide({requirements}).human_approval_required).toBe(true);});
});
