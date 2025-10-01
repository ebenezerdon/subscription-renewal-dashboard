/* helpers.js
   Responsibilities:
   - Local storage persistence helpers
   - Date math utilities for recurring charges
   - Formatters and validators
   Exposes functions on window.Helpers
*/
(function(window, $){
  'use strict';

  const STORAGE_KEY = 'subscriptions.v1';

  const Helpers = {};

  // Simple id generator
  Helpers.uuid = function(){
    return 'sub_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2,8);
  };

  // Persist array of subscriptions
  Helpers.save = function(list){
    try{
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list || []));
    }catch(e){
      console.error('Failed to save data', e);
    }
  };

  Helpers.load = function(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    }catch(e){
      console.error('Failed to load data', e);
      return [];
    }
  };

  // Ensure value is numeric and return cents as number
  Helpers.parseAmount = function(val){
    if (val === null || val === undefined) return 0;
    const n = parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
    if (isNaN(n)) return 0;
    return Math.round(n * 100) / 100;
  };

  Helpers.formatCurrency = function(v){
    const n = Number(v) || 0;
    return n.toLocaleString(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2 });
  };

  // Add months reliably (handle month overflow)
  Helpers.addMonths = function(date, months){
    const d = new Date(date.getTime());
    const day = d.getDate();
    d.setMonth(d.getMonth() + months);
    // If the month changed and day overflowed, set to last day of previous month
    if (d.getDate() < day) {
      d.setDate(0);
    }
    return d;
  };

  // Add weeks
  Helpers.addWeeks = function(date, weeks){
    const d = new Date(date.getTime());
    d.setDate(d.getDate() + 7 * weeks);
    return d;
  };

  // Add years
  Helpers.addYears = function(date, years){
    const d = new Date(date.getTime());
    d.setFullYear(d.getFullYear() + years);
    return d;
  };

  // Compute next occurrence on or after fromDate, given a stored start date and frequency
  Helpers.nextOccurrence = function(startIso, frequency, fromDate){
    const start = new Date(startIso);
    const now = fromDate ? new Date(fromDate) : new Date();
    // Normalize time to midnight for comparisons
    start.setHours(0,0,0,0);
    now.setHours(0,0,0,0);

    if (now <= start) return new Date(start);

    let candidate = new Date(start);
    if (frequency === 'weekly'){
      const daysDiff = Math.ceil((now - start) / (1000*60*60*24));
      const weeks = Math.floor(daysDiff / 7);
      candidate = Helpers.addWeeks(start, weeks);
      while(candidate < now) candidate = Helpers.addWeeks(candidate, 1);
      return candidate;
    }

    if (frequency === 'monthly'){
      // increment by months
      let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      candidate = Helpers.addMonths(start, months);
      while(candidate < now) candidate = Helpers.addMonths(candidate, 1);
      return candidate;
    }

    if (frequency === 'quarterly'){
      let months = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      let quarters = Math.floor(months / 3);
      candidate = Helpers.addMonths(start, quarters * 3);
      while(candidate < now) candidate = Helpers.addMonths(candidate, 3);
      return candidate;
    }

    if (frequency === 'yearly'){
      let years = now.getFullYear() - start.getFullYear();
      candidate = Helpers.addYears(start, years);
      while(candidate < now) candidate = Helpers.addYears(candidate, 1);
      return candidate;
    }

    // Fallback: return start
    return new Date(start);
  };

  // Generate occurrences between from (inclusive) and to (inclusive)
  Helpers.generateOccurrences = function(sub, from, to){
    const list = [];
    let next = Helpers.nextOccurrence(sub.startDate, sub.frequency, from);
    // If subscription disabled, return empty
    if (sub.enabled === false) return list;

    while(next <= to){
      list.push({ id: sub.id, name: sub.name, amount: sub.amount, date: new Date(next), frequency: sub.frequency });
      // increment next
      if (sub.frequency === 'weekly') next = Helpers.addWeeks(next, 1);
      else if (sub.frequency === 'monthly') next = Helpers.addMonths(next, 1);
      else if (sub.frequency === 'quarterly') next = Helpers.addMonths(next, 3);
      else if (sub.frequency === 'yearly') next = Helpers.addYears(next, 1);
      else break; // unknown frequency
    }

    return list;
  };

  // Basic validation for incoming subscription data
  Helpers.validateSub = function(obj){
    const errors = [];
    if (!obj.name || String(obj.name).trim().length < 1) errors.push('name');
    if (isNaN(Helpers.parseAmount(obj.amount)) || Helpers.parseAmount(obj.amount) <= 0) errors.push('amount');
    if (!obj.startDate || isNaN(new Date(obj.startDate).getTime())) errors.push('startDate');
    if (!['weekly','monthly','quarterly','yearly'].includes(obj.frequency)) errors.push('frequency');
    return errors;
  };

  // Expose
  window.Helpers = Helpers;

})(window, jQuery);
