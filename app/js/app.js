/* =====================================================
   VakilAI App JavaScript
   All screens — Sidebar, Assessment, Policy, Calendar, Query, Dashboard
   ===================================================== */

(function () {
  'use strict';

  /* =====================================================
     SIDEBAR — Active state & mobile toggle
     ===================================================== */
  function initSidebar() {
    const page = window.location.pathname.split('/').pop() || 'dashboard.html';
    document.querySelectorAll('.nav-item[data-page]').forEach(function (el) {
      if (el.dataset.page === page) {
        el.classList.add('active');
      }
    });

    const hamburger = document.getElementById('hamburger-btn');
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');

    if (hamburger && sidebar && overlay) {
      hamburger.addEventListener('click', function () {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('open');
      });

      overlay.addEventListener('click', function () {
        sidebar.classList.remove('open');
        overlay.classList.remove('open');
      });
    }
  }

  /* =====================================================
     DASHBOARD — Animate circular progress on load
     ===================================================== */
  function initDashboard() {
    if (!document.getElementById('dashboard-page')) return;

    // Animate the circular progress ring
    var rings = document.querySelectorAll('.progress-ring-circle');
    rings.forEach(function (ring) {
      var radius = parseFloat(ring.getAttribute('r'));
      var circumference = 2 * Math.PI * radius;
      var score = parseFloat(ring.dataset.score || 0);
      var offset = circumference - (score / 100) * circumference;

      ring.style.strokeDasharray = circumference + ' ' + circumference;
      ring.style.strokeDashoffset = circumference;

      setTimeout(function () {
        ring.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1)';
        ring.style.strokeDashoffset = offset;
      }, 200);
    });

    // Animate bar chart fills
    var bars = document.querySelectorAll('.chart-bar-fill[data-width]');
    bars.forEach(function (bar) {
      bar.style.width = '0%';
      setTimeout(function () {
        bar.style.width = bar.dataset.width;
      }, 400);
    });
  }

  /* =====================================================
     ASSESSMENT — Multi-step form logic
     ===================================================== */
  var assessmentState = {
    currentStep: 1,
    totalSteps: 7,
    data: {}
  };

  function initAssessment() {
    if (!document.getElementById('assessment-page')) return;

    // Handle hash on load
    var hash = window.location.hash;
    if (hash && hash.startsWith('#step')) {
      var step = parseInt(hash.replace('#step', ''), 10);
      if (step >= 1 && step <= 7) {
        goToStep(step);
      }
    }

    // Next button
    var nextBtn = document.getElementById('next-step-btn');
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        if (validateCurrentStep()) {
          var nextStep = assessmentState.currentStep + 1;
          if (nextStep <= assessmentState.totalSteps) {
            goToStep(nextStep);
          }
        }
      });
    }

    // Prev button
    var prevBtn = document.getElementById('prev-step-btn');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        var prevStep = assessmentState.currentStep - 1;
        if (prevStep >= 1) {
          goToStep(prevStep);
        }
      });
    }

    // Radio option styling
    document.querySelectorAll('.radio-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var name = opt.querySelector('input[type="radio"]').name;
        document.querySelectorAll('.radio-option input[name="' + name + '"]').forEach(function (inp) {
          inp.closest('.radio-option').classList.remove('selected');
        });
        opt.classList.add('selected');
        opt.querySelector('input[type="radio"]').checked = true;
      });
    });

    // Checkbox option styling
    document.querySelectorAll('.checkbox-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var checkbox = opt.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        opt.classList.toggle('checked', checkbox.checked);
      });
    });
  }

  function goToStep(stepNum) {
    assessmentState.currentStep = stepNum;
    window.location.hash = 'step' + stepNum;

    // Update step indicators
    document.querySelectorAll('.step-item').forEach(function (el, idx) {
      var n = idx + 1;
      el.classList.remove('active', 'completed');
      if (n < stepNum) el.classList.add('completed');
      if (n === stepNum) el.classList.add('active');
    });

    // Update step circle icons for completed steps
    document.querySelectorAll('.step-circle').forEach(function (el, idx) {
      var n = idx + 1;
      if (n < stepNum) {
        el.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>';
      } else {
        el.textContent = n;
      }
    });

    // Show/hide step panels
    document.querySelectorAll('.step-panel').forEach(function (panel) {
      panel.style.display = 'none';
    });
    var activePanel = document.getElementById('step-panel-' + stepNum);
    if (activePanel) {
      activePanel.style.display = 'block';
      // Fade in
      activePanel.style.opacity = '0';
      activePanel.style.transform = 'translateY(8px)';
      setTimeout(function () {
        activePanel.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
        activePanel.style.opacity = '1';
        activePanel.style.transform = 'translateY(0)';
      }, 10);
    }

    // Update progress bar in sidebar
    var pct = Math.round(((stepNum - 1) / assessmentState.totalSteps) * 100);
    var progressFill = document.getElementById('assessment-progress-fill');
    var progressLabel = document.getElementById('assessment-progress-label');
    if (progressFill) progressFill.style.width = pct + '%';
    if (progressLabel) progressLabel.textContent = pct + '% complete';

    // Update prev button visibility
    var prevBtn = document.getElementById('prev-step-btn');
    if (prevBtn) {
      prevBtn.style.visibility = stepNum > 1 ? 'visible' : 'hidden';
    }

    // Handle step 7 — generate report
    if (stepNum === 7) {
      setTimeout(generateAssessmentReport, 600);
    }
  }

  function validateCurrentStep() {
    var panel = document.getElementById('step-panel-' + assessmentState.currentStep);
    if (!panel) return true;

    var requiredInputs = panel.querySelectorAll('[required]');
    var valid = true;
    requiredInputs.forEach(function (inp) {
      inp.closest('.form-group') && inp.closest('.form-group').classList.remove('has-error');
      if (!inp.value.trim()) {
        valid = false;
        if (inp.closest('.form-group')) inp.closest('.form-group').classList.add('has-error');
        inp.focus();
      }
    });
    return valid;
  }

  function generateAssessmentReport() {
    var loadingEl = document.getElementById('report-loading');
    var reportEl = document.getElementById('report-result');
    if (!loadingEl || !reportEl) return;

    loadingEl.style.display = 'flex';
    reportEl.style.display = 'none';

    // Simulate AI analysis
    setTimeout(function () {
      loadingEl.style.display = 'none';
      reportEl.style.display = 'block';
      reportEl.style.opacity = '0';
      setTimeout(function () {
        reportEl.style.transition = 'opacity 0.4s ease';
        reportEl.style.opacity = '1';
      }, 10);

      // Animate score ring
      var rings = reportEl.querySelectorAll('.progress-ring-circle');
      rings.forEach(function (ring) {
        var radius = parseFloat(ring.getAttribute('r'));
        var circumference = 2 * Math.PI * radius;
        var score = parseFloat(ring.dataset.score || 0);
        var offset = circumference - (score / 100) * circumference;
        ring.style.strokeDasharray = circumference + ' ' + circumference;
        ring.style.strokeDashoffset = circumference;
        setTimeout(function () {
          ring.style.transition = 'stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)';
          ring.style.strokeDashoffset = offset;
        }, 200);
      });
    }, 2800);
  }

  /* =====================================================
     POLICY GENERATOR
     ===================================================== */
  function initPolicyGenerator() {
    if (!document.getElementById('policy-page')) return;

    var generateBtn = document.getElementById('generate-policy-btn');
    if (generateBtn) {
      generateBtn.addEventListener('click', generatePolicy);
    }

    // Toggle third-party section visibility
    var shareToggle = document.getElementById('share-data-toggle');
    var thirdPartySection = document.getElementById('third-party-section');
    if (shareToggle && thirdPartySection) {
      shareToggle.addEventListener('change', function () {
        thirdPartySection.style.display = shareToggle.checked ? 'block' : 'none';
      });
    }

    // Checkbox option styling
    document.querySelectorAll('#policy-page .checkbox-option').forEach(function (opt) {
      opt.addEventListener('click', function () {
        var checkbox = opt.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        opt.classList.toggle('checked', checkbox.checked);
      });
    });

    // Copy button
    var copyBtn = document.getElementById('copy-policy-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var text = document.getElementById('policy-preview-text');
        if (text) {
          navigator.clipboard.writeText(text.innerText).then(function () {
            copyBtn.textContent = 'Copied!';
            setTimeout(function () { copyBtn.textContent = 'Copy Text'; }, 2000);
          });
        }
      });
    }
  }

  function generatePolicy() {
    var btn = document.getElementById('generate-policy-btn');
    var placeholder = document.getElementById('preview-placeholder');
    var content = document.getElementById('preview-content');
    var previewText = document.getElementById('policy-preview-text');

    if (!btn) return;

    // Get form values
    var companyName = document.getElementById('company-name') ? document.getElementById('company-name').value || 'Your Company' : 'Your Company';
    var websiteUrl = document.getElementById('website-url') ? document.getElementById('website-url').value || 'www.yourcompany.com' : 'www.yourcompany.com';
    var grievanceName = document.getElementById('grievance-name') ? document.getElementById('grievance-name').value || 'Grievance Officer' : 'Grievance Officer';
    var grievanceEmail = document.getElementById('grievance-email') ? document.getElementById('grievance-email').value || 'grievance@yourcompany.com' : 'grievance@yourcompany.com';
    var grievanceState = document.getElementById('grievance-state') ? document.getElementById('grievance-state').value || 'Maharashtra' : 'Maharashtra';
    var retentionPeriod = document.getElementById('retention-period') ? document.getElementById('retention-period').value || '1 year' : '1 year';

    // Collect checked data types
    var dataTypes = [];
    document.querySelectorAll('.data-type-check:checked').forEach(function (cb) {
      dataTypes.push(cb.dataset.label);
    });

    var purposes = [];
    document.querySelectorAll('.purpose-check:checked').forEach(function (cb) {
      purposes.push(cb.dataset.label);
    });

    // Loading state
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Generating...';

    setTimeout(function () {
      btn.disabled = false;
      btn.innerHTML = 'Generate Policy';

      if (placeholder) placeholder.style.display = 'none';
      if (content) content.classList.add('visible');

      var today = new Date();
      var dateStr = today.toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' });

      var dataList = dataTypes.length > 0 ? dataTypes : ['Name & Contact Information', 'Email Address', 'Device Information'];
      var purposeList = purposes.length > 0 ? purposes : ['Service Delivery', 'Customer Support'];

      if (previewText) {
        previewText.innerHTML = generatePolicyHTML(companyName, websiteUrl, grievanceName, grievanceEmail, grievanceState, retentionPeriod, dataList, purposeList, dateStr);
      }
    }, 2000);
  }

  function generatePolicyHTML(company, url, grievanceName, grievanceEmail, grievanceState, retention, dataList, purposeList, dateStr) {
    return '<h1>Privacy Policy — ' + company + '</h1>' +
      '<p><strong>Effective Date:</strong> ' + dateStr + '<br>' +
      '<strong>Website/App:</strong> ' + url + '</p>' +
      '<h2>1. Introduction</h2>' +
      '<p>' + company + ' ("we," "us," or "our") is committed to protecting your personal data in accordance with the Digital Personal Data Protection Act, 2023 ("DPDP Act") and other applicable Indian laws. This Privacy Policy explains how we collect, use, store, and protect your personal information when you access our services through ' + url + '.</p>' +
      '<h2>2. Data We Collect</h2>' +
      '<p>We collect the following categories of personal data:</p>' +
      '<ul>' + dataList.map(function (d) { return '<li>' + d + '</li>'; }).join('') + '</ul>' +
      '<h2>3. Purpose of Processing</h2>' +
      '<p>Your personal data is collected and processed for the following purposes:</p>' +
      '<ul>' + purposeList.map(function (p) { return '<li>' + p + '</li>'; }).join('') + '</ul>' +
      '<h2>4. Legal Basis for Processing</h2>' +
      '<p>We process your personal data on the basis of your <strong>consent</strong> as required under Section 6 of the DPDP Act, 2023. You have the right to withdraw consent at any time. We also process data where necessary for the performance of a contract or to comply with a legal obligation.</p>' +
      '<h2>5. Data Retention</h2>' +
      '<p>We retain your personal data only for as long as necessary to fulfill the purposes for which it was collected, or as required by applicable law. Specifically, we retain personal data for a period of <strong>' + retention + '</strong> from the date of collection, after which it is securely deleted or anonymized. Certain records may be retained longer where required by the Income Tax Act, 1961, or other applicable legislation.</p>' +
      '<h2>6. Data Sharing & Third Parties</h2>' +
      '<p>We do not sell your personal data. We may share your data with third-party service providers who process data on our behalf under data processing agreements that ensure equivalent levels of data protection. All third parties are obligated to handle your data in compliance with applicable law.</p>' +
      '<h2>7. Your Rights as a Data Principal</h2>' +
      '<p>Under the DPDP Act, 2023, you have the following rights:</p>' +
      '<ul>' +
      '<li><strong>Right to Information:</strong> Know what personal data we hold about you</li>' +
      '<li><strong>Right to Correction:</strong> Request correction of inaccurate or incomplete data</li>' +
      '<li><strong>Right to Erasure:</strong> Request deletion of your personal data (subject to legal retention obligations)</li>' +
      '<li><strong>Right to Grievance Redressal:</strong> Lodge complaints with our Grievance Officer or the Data Protection Board of India</li>' +
      '<li><strong>Right to Nominate:</strong> Nominate another person to exercise rights on your behalf in the event of death or incapacity</li>' +
      '</ul>' +
      '<h2>8. Data Security</h2>' +
      '<p>We implement appropriate technical and organizational security measures to protect your personal data against unauthorized access, accidental loss, destruction, or damage. These include encryption, access controls, and regular security assessments.</p>' +
      '<h2>9. Grievance Officer</h2>' +
      '<p>In accordance with Section 13 of the DPDP Act, 2023, we have appointed a Grievance Officer to address your concerns:</p>' +
      '<p><strong>Name:</strong> ' + grievanceName + '<br>' +
      '<strong>Email:</strong> ' + grievanceEmail + '<br>' +
      '<strong>Location:</strong> ' + grievanceState + ', India<br>' +
      '<strong>Response Time:</strong> Within 72 hours of receipt of complaint</p>' +
      '<h2>10. Updates to This Policy</h2>' +
      '<p>We may update this Privacy Policy from time to time to reflect changes in law or our data practices. We will notify you of any material changes by updating the effective date above and, where appropriate, through direct notification. Continued use of our services after changes constitutes acceptance of the revised policy.</p>' +
      '<h2>11. Contact Us</h2>' +
      '<p>For any privacy-related questions or to exercise your rights, please contact our Grievance Officer at <strong>' + grievanceEmail + '</strong>.</p>';
  }

  /* =====================================================
     CALENDAR — Add Custom Event Modal
     ===================================================== */
  function initCalendar() {
    if (!document.getElementById('calendar-page')) return;

    var addBtn = document.getElementById('add-event-btn');
    var modal = document.getElementById('add-event-modal');
    var closeBtn = document.getElementById('modal-close-btn');
    var cancelBtn = document.getElementById('modal-cancel-btn');
    var saveBtn = document.getElementById('modal-save-btn');

    function openModal() {
      if (modal) modal.classList.add('open');
      document.body.style.overflow = 'hidden';
    }

    function closeModal() {
      if (modal) modal.classList.remove('open');
      document.body.style.overflow = '';
    }

    if (addBtn) addBtn.addEventListener('click', openModal);
    if (closeBtn) closeBtn.addEventListener('click', closeModal);
    if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target === modal) closeModal();
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', function () {
        var title = document.getElementById('event-title');
        var date = document.getElementById('event-date');
        var category = document.getElementById('event-category');

        if (title && date && title.value && date.value) {
          addCalendarEvent(title.value, date.value, category ? category.value : 'Other');
          closeModal();
          if (title) title.value = '';
          if (date) date.value = '';
        } else {
          if (title && !title.value) title.style.borderColor = 'var(--error)';
          if (date && !date.value) date.style.borderColor = 'var(--error)';
        }
      });
    }

    // View toggle
    document.querySelectorAll('.view-toggle-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('.view-toggle-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
      });
    });
  }

  function addCalendarEvent(title, date, category) {
    var dateObj = new Date(date);
    var now = new Date();
    var diffDays = Math.ceil((dateObj - now) / (1000 * 60 * 60 * 24));
    var upcoming = document.getElementById('upcoming-section');
    if (!upcoming) return;

    var item = document.createElement('div');
    item.className = 'calendar-item border-violet';
    item.innerHTML =
      '<div class="calendar-item-icon" style="background:var(--primary-light);color:var(--primary);">' +
      '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>' +
      '</div>' +
      '<div class="calendar-item-body">' +
      '<div class="calendar-item-title">' + title + '</div>' +
      '<div class="calendar-item-meta">' +
      '<span>Due: ' + dateObj.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) + '</span>' +
      '<span class="badge badge-primary">' + category + '</span>' +
      '</div>' +
      '</div>' +
      '<div class="calendar-item-right">' +
      '<span class="days-pill days-future">' + diffDays + ' days</span>' +
      '<button class="btn btn-secondary btn-sm">View Details</button>' +
      '</div>';

    upcoming.insertBefore(item, upcoming.firstChild);

    // Brief highlight animation
    item.style.background = 'var(--primary-light)';
    setTimeout(function () {
      item.style.transition = 'background 0.6s ease';
      item.style.background = 'var(--surface)';
    }, 100);
  }

  /* =====================================================
     LEGAL QUERY — Chat interface
     ===================================================== */
  var mockResponses = [
    "Under Indian law, this area is governed by multiple overlapping regulations. The key legislation to consider includes the DPDP Act 2023 for data-related matters, and sector-specific rules from SEBI, RBI, or IRDAI depending on your industry.\n\n**Key requirements:**\n• Ensure documented consent where required\n• Maintain records for the statutory period\n• Designate responsible officers as mandated\n• File returns within prescribed timelines\n\n**Sources:** DPDP Act, 2023; IT Act, 2000 (amended 2008)",
    "This is a nuanced area under Indian corporate law. The Companies Act, 2013 and its rules set out the primary framework, with additional requirements under SEBI regulations for listed entities.\n\n**Practical steps:**\n• Review your Articles of Association for any additional restrictions\n• Ensure board resolutions are passed with requisite majority\n• File applicable forms with the MCA within the prescribed timeframe\n• Maintain statutory registers as required\n\n**Sources:** Companies Act, 2013 — Sections 96, 117, 179; Companies (Management and Administration) Rules, 2014",
    "GST applicability depends on the classification of supply and the place of supply rules. For digital services and SaaS products, the key considerations are:\n\n**Classification:**\n• SaaS services are classified as 'Online Information and Database Access and Retrieval Services' (OIDAR) under GST\n• Standard rate: 18% GST\n• B2B supplies — reverse charge may apply for foreign vendors\n\n**Compliance requirements:**\n• GSTR-1 (monthly/quarterly)\n• GSTR-3B (monthly)\n• Annual return GSTR-9\n\n**Sources:** CGST Act, 2017 — Section 2(17); GST Notification 10/2017; OIDAR rules"
  ];

  var responseIndex = 0;

  function initQuery() {
    if (!document.getElementById('query-page')) return;

    var input = document.getElementById('query-input');
    var sendBtn = document.getElementById('send-query-btn');
    var messagesContainer = document.getElementById('chat-messages');

    function sendMessage() {
      if (!input || !input.value.trim()) return;
      var text = input.value.trim();
      input.value = '';
      input.style.height = '44px';

      // Add user message
      appendMessage('user', text);

      // Show typing indicator
      var typingEl = document.createElement('div');
      typingEl.className = 'message message-ai';
      typingEl.id = 'typing-indicator';
      typingEl.innerHTML = '<div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div><div class="message-meta"><span class="ai-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 110 20A10 10 0 0112 2z" opacity="0.3"/><path d="M12 6a1 1 0 011 1v4l3 3-1.5 1.5L11 13V7a1 1 0 011-1z"/></svg> VakilAI</span> <span>Analyzing...</span></div>';
      messagesContainer.appendChild(typingEl);
      scrollChat();

      setTimeout(function () {
        var typing = document.getElementById('typing-indicator');
        if (typing) typing.remove();

        var resp = mockResponses[responseIndex % mockResponses.length];
        responseIndex++;
        appendMessage('ai', resp);
        scrollChat();
      }, 1600);
    }

    if (sendBtn) {
      sendBtn.addEventListener('click', sendMessage);
    }

    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) {
          e.preventDefault();
          sendMessage();
        }
      });

      // Auto-grow textarea
      input.addEventListener('input', function () {
        this.style.height = '44px';
        this.style.height = Math.min(this.scrollHeight, 120) + 'px';
      });
    }

    // Chat history items
    document.querySelectorAll('.chat-history-item').forEach(function (item) {
      item.addEventListener('click', function () {
        document.querySelectorAll('.chat-history-item').forEach(function (i) { i.classList.remove('active'); });
        item.classList.add('active');
      });
    });

    scrollChat();
  }

  function appendMessage(type, text) {
    var container = document.getElementById('chat-messages');
    if (!container) return;

    var el = document.createElement('div');
    el.className = 'message message-' + type;

    var now = new Date();
    var timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

    if (type === 'user') {
      el.innerHTML =
        '<div class="message-bubble-user">' + escapeHtml(text) + '</div>' +
        '<div class="message-meta"><span>' + timeStr + '</span></div>';
    } else {
      // Convert markdown-style to HTML
      var formatted = formatAIResponse(text);
      el.innerHTML =
        '<div class="message-bubble-ai"><div id="policy-preview-text">' + formatted + '</div></div>' +
        '<div class="message-meta"><span class="ai-badge"><svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" style="margin-right:2px"><circle cx="12" cy="12" r="10" opacity="0.2"/><path d="M9 12l2 2 4-4"/></svg>VakilAI</span> <span>' + timeStr + '</span></div>';
    }

    el.style.opacity = '0';
    el.style.transform = 'translateY(8px)';
    container.appendChild(el);

    setTimeout(function () {
      el.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 10);
  }

  function formatAIResponse(text) {
    // Bold
    text = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Bullet lines
    var lines = text.split('\n');
    var result = '';
    var inList = false;
    lines.forEach(function (line) {
      line = line.trim();
      if (!line) {
        if (inList) { result += '</ul>'; inList = false; }
        return;
      }
      if (line.startsWith('•')) {
        if (!inList) { result += '<ul>'; inList = true; }
        result += '<li>' + line.substring(1).trim() + '</li>';
      } else {
        if (inList) { result += '</ul>'; inList = false; }
        result += '<p>' + line + '</p>';
      }
    });
    if (inList) result += '</ul>';
    return result;
  }

  function escapeHtml(text) {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function scrollChat() {
    var container = document.getElementById('chat-messages');
    if (container) {
      setTimeout(function () {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  /* =====================================================
     FORM VALIDATION HELPERS
     ===================================================== */
  function initFormValidation() {
    document.querySelectorAll('.form-input[required], .form-select[required]').forEach(function (inp) {
      inp.addEventListener('blur', function () {
        var group = inp.closest('.form-group');
        if (!group) return;
        if (!inp.value.trim()) {
          group.classList.add('has-error');
        } else {
          group.classList.remove('has-error');
        }
      });

      inp.addEventListener('input', function () {
        var group = inp.closest('.form-group');
        if (group && inp.value.trim()) {
          group.classList.remove('has-error');
          inp.style.borderColor = '';
        }
      });
    });
  }

  /* =====================================================
     TOPBAR — Notification dropdown (simple toggle)
     ===================================================== */
  function initTopbar() {
    var notifBtn = document.getElementById('notif-btn');
    var notifPanel = document.getElementById('notif-panel');

    if (notifBtn && notifPanel) {
      notifBtn.addEventListener('click', function (e) {
        e.stopPropagation();
        notifPanel.classList.toggle('open');
      });

      document.addEventListener('click', function () {
        if (notifPanel) notifPanel.classList.remove('open');
      });
    }
  }

  /* =====================================================
     INIT — Run all initializers on DOM ready
     ===================================================== */
  document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initTopbar();
    initDashboard();
    initAssessment();
    initPolicyGenerator();
    initCalendar();
    initQuery();
    initFormValidation();
  });

})();
