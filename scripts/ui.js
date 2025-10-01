/* ui.js
   Responsibilities:
   - Define window.App namespace
   - Manage in-memory state and UI rendering
   - Provide App.init and App.render as required by contract
   Uses jQuery for DOM manipulation.
*/
(function(window, $){
  'use strict';

  window.App = window.App || {};

  const App = window.App;

  // Internal state
  App.state = {
    subs: [],
    projectionDays: 30,
    filterFrequency: 'all',
    search: ''
  };

  // Initialize event handlers and load data
  App.init = function(){
    try{
      App.state.subs = Helpers.load();
      // wire UI events
      $('#add-sub-btn, #empty-add').on('click', App.openAddModal);
      $('#import-btn').on('click', App.handleImport);
      $('#search').on('input', App.handleSearch);
      $('#projection-range').on('change', App.handleProjectionChange);
      $('#filter-frequency').on('change', App.handleFilterChange);

      // Modal dismiss
      $(document).on('click', '[data-dismiss="modal"]', function(){ App.closeModal(); });
      $(document).on('keydown', function(e){ if (e.key === 'Escape') App.closeModal(); });

      // Form submit
      $('#sub-form').on('submit', App.handleSaveSub);

      // Accessibility improvements
      $('#subscriptions-list').on('keydown', '.sub-card', function(e){
        const $this = $(this);
        if (e.key === 'Enter') { $this.trigger('click'); }
      });

      // Delegated actions for edit/delete
      $('#subscriptions-list').on('click', '.edit-sub', function(e){
        e.stopPropagation();
        const id = $(this).closest('.sub-card').data('id');
        App.openEditModal(id);
      });
      $('#subscriptions-list').on('click', '.delete-sub', function(e){
        e.stopPropagation();
        const id = $(this).closest('.sub-card').data('id');
        App.deleteSubscription(id);
      });

      // Clicking a subscription opens edit
      $('#subscriptions-list').on('click', '.sub-card', function(){
        const id = $(this).data('id');
        App.openEditModal(id);
      });

    }catch(e){
      console.error('App.init error', e);
    }
  };

  App.render = function(){
    try{
      App.renderList();
      App.renderProjections();
    }catch(e){
      console.error('App.render error', e);
    }
  };

  // --- UI handlers ---
  App.handleSearch = function(){
    App.state.search = $(this).val().toLowerCase();
    App.renderList();
    App.renderProjections();
  };

  App.handleProjectionChange = function(){
    App.state.projectionDays = parseInt($(this).val(), 10) || 30;
    App.renderProjections();
  };

  App.handleFilterChange = function(){
    App.state.filterFrequency = $(this).val();
    App.renderProjections();
  };

  App.openAddModal = function(){
    App.editingId = null;
    $('#modal-title').text('Add subscription');
    $('#sub-form')[0].reset();
    // default date = today
    const today = new Date().toISOString().slice(0,10);
    $('#start-date').val(today);
    $('#modal').attr('aria-hidden', 'false');
    // focus first input
    setTimeout(function(){ $('#name').focus(); }, 80);
  };

  App.openEditModal = function(id){
    const sub = App.state.subs.find(s => s.id === id);
    if (!sub) return;
    App.editingId = id;
    $('#modal-title').text('Edit subscription');
    $('#name').val(sub.name);
    $('#amount').val(sub.amount);
    $('#start-date').val(sub.startDate.slice(0,10));
    $('#frequency').val(sub.frequency);
    $('#auto-renew').prop('checked', !!sub.autoRenew);
    $('#enabled').prop('checked', sub.enabled !== false);
    $('#modal').attr('aria-hidden', 'false');
    setTimeout(function(){ $('#name').focus(); }, 80);
  };

  App.closeModal = function(){
    $('#modal').attr('aria-hidden', 'true');
  };

  App.handleSaveSub = function(e){
    e.preventDefault();
    try{
      const data = {
        id: App.editingId || Helpers.uuid(),
        name: $('#name').val().trim(),
        amount: Helpers.parseAmount($('#amount').val()),
        startDate: $('#start-date').val(),
        frequency: $('#frequency').val(),
        autoRenew: !!$('#auto-renew').prop('checked'),
        enabled: !!$('#enabled').prop('checked')
      };

      const invalid = Helpers.validateSub(data);
      if (invalid.length){
        alert('Please fix required fields');
        return;
      }

      // Normalize startDate to ISO date
      data.startDate = new Date(data.startDate).toISOString();

      // Replace or add
      const idx = App.state.subs.findIndex(s => s.id === data.id);
      if (idx >= 0) App.state.subs[idx] = data; else App.state.subs.push(data);
      Helpers.save(App.state.subs);
      App.closeModal();
      App.render();
    }catch(err){
      console.error('Save failed', err);
      alert('Failed to save subscription');
    }
  };

  App.deleteSubscription = function(id){
    if (!confirm('Delete this subscription?')) return;
    App.state.subs = App.state.subs.filter(s => s.id !== id);
    Helpers.save(App.state.subs);
    App.render();
  };

  App.handleImport = function(){
    const example = [
      { id: Helpers.uuid(), name: 'Streaming Plus', amount: 12.99, startDate: new Date().toISOString(), frequency: 'monthly', autoRenew: true, enabled: true },
      { id: Helpers.uuid(), name: 'Pro Cloud', amount: 99.00, startDate: new Date().toISOString(), frequency: 'yearly', autoRenew: true, enabled: true }
    ];
    if (confirm('Import two example subscriptions? This will append to your list.')){
      App.state.subs = App.state.subs.concat(example);
      Helpers.save(App.state.subs);
      App.render();
    }
  };

  // Render the subscription list in the left column
  App.renderList = function(){
    const $list = $('#subscriptions-list');
    $list.empty();

    const filtered = App.state.subs.filter(s => {
      if (App.state.search && !s.name.toLowerCase().includes(App.state.search)) return false;
      return true;
    });

    $('#sub-count').text(filtered.length);

    if (!filtered.length){
      $list.append('<li class="text-sm text-slate-500">No subscriptions yet. Add one to see it here.</li>');
      return;
    }

    filtered.sort((a,b) => a.name.localeCompare(b.name));

    filtered.forEach(s => {
      const next = Helpers.nextOccurrence(s.startDate, s.frequency);
      const days = Math.round((new Date(next).getTime() - new Date().setHours(0,0,0,0)) / (1000*60*60*24));
      const soonClass = days <= 7 ? 'badge-soon' : 'text-slate-600';
      const html = $(`
        <li>
          <div tabindex="0" role="button" class="sub-card sub-item flex items-center gap-4 p-3 rounded-md border border-slate-100 bg-white hover:bg-slate-50 focus:bg-slate-50" data-id="${s.id}">
            <div class="min-w-0 flex-1">
              <div class="text-sm font-medium truncate">${escapeHtml(s.name)}</div>
              <div class="text-xs text-slate-500 truncate">${s.frequency} • next ${new Date(next).toLocaleDateString()}</div>
            </div>
            <div class="flex items-center gap-3 ml-2">
              <div class="text-sm font-semibold text-slate-700 text-right w-28">${Helpers.formatCurrency(s.amount)}</div>
              <div class="flex items-center gap-2">
                <button class="edit-sub text-indigo-600 hover:text-indigo-800 text-sm" aria-label="Edit ${escapeHtml(s.name)}">Edit</button>
                <button class="delete-sub text-rose-600 hover:text-rose-800 text-sm" aria-label="Delete ${escapeHtml(s.name)}">Delete</button>
              </div>
            </div>
          </div>
        </li>
      `);
      $list.append(html);
    });
  };

  // Escape HTML to avoid injection
  function escapeHtml(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  // Render upcoming charges in the main area
  App.renderProjections = function(){
    const $up = $('#upcoming-list');
    $up.empty();
    const emptyState = $('#empty-state');

    const now = new Date();
    now.setHours(0,0,0,0);
    const to = new Date(now.getTime());
    to.setDate(to.getDate() + App.state.projectionDays);

    let occurrences = [];
    App.state.subs.forEach(s => {
      if (App.state.filterFrequency !== 'all' && s.frequency !== App.state.filterFrequency) return;
      const occ = Helpers.generateOccurrences(s, now, to);
      occurrences = occurrences.concat(occ);
    });

    // Sort by date
    occurrences.sort((a,b) => a.date - b.date || a.name.localeCompare(b.name));

    if (!occurrences.length){
      emptyState.show();
      $('#total-30').text(Helpers.formatCurrency(0));
      $('#total-month').text(Helpers.formatCurrency(0));
      return;
    }

    emptyState.hide();

    // Group by date string
    const groups = {};
    occurrences.forEach(o => {
      const key = o.date.toISOString().slice(0,10);
      groups[key] = groups[key] || [];
      groups[key].push(o);
    });

    let totalProjected = 0;
    const monthTotal = App.estimateMonthly();

    Object.keys(groups).forEach(dateKey => {
      const items = groups[dateKey];
      const d = new Date(dateKey);
      const daysAway = Math.round((d - now) / (1000*60*60*24));
      const isToday = daysAway === 0;
      const soon = daysAway > 0 && daysAway <= 7;

      const dayHeader = $(`
        <div class="py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="text-sm font-medium">${d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</div>
              <div class="text-xs text-slate-500">${isToday ? 'Today' : (soon ? (daysAway + ' days') : '')}</div>
            </div>
            <div class="text-sm text-slate-600">${Helpers.formatCurrency(items.reduce((s,it)=>s+Number(it.amount),0))}</div>
          </div>
          <div class="mt-3 space-y-2">
          </div>
        </div>
      `);

      const $container = dayHeader.find('div.mt-3');

      items.forEach(it => {
        totalProjected += Number(it.amount);
        const badge = isToday ? '<span class="px-2 py-0.5 text-xs rounded-full badge-today">Today</span>' : (soon ? '<span class="px-2 py-0.5 text-xs rounded-full badge-soon">Soon</span>' : '');
        const itemHtml = $(`
          <div class="flex items-center justify-between p-3 rounded-md border border-slate-100">
            <div>
              <div class="text-sm font-medium">${escapeHtml(it.name)}</div>
              <div class="text-xs text-slate-500">${it.frequency} ${badge}</div>
            </div>
            <div class="text-sm font-semibold">${Helpers.formatCurrency(it.amount)}</div>
          </div>
        `);
        $container.append(itemHtml);
      });

      $up.append(dayHeader);
    });

    $('#total-30').text(Helpers.formatCurrency(totalProjected));
    $('#total-month').text(Helpers.formatCurrency(monthTotal));
  };

  // Estimate monthly total using occurrences over 365 days and averaging
  App.estimateMonthly = function(){
    const now = new Date(); now.setHours(0,0,0,0);
    const to = new Date(now.getTime()); to.setDate(to.getDate() + 365);
    let occurrences = [];
    App.state.subs.forEach(s => {
      const occ = Helpers.generateOccurrences(s, now, to);
      occurrences = occurrences.concat(occ);
    });
    const totalYear = occurrences.reduce((s,o) => s + Number(o.amount), 0);
    const monthly = totalYear / 12;
    return Math.round(monthly * 100) / 100;
  };

})(window, jQuery);
