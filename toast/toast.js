/**
 * Toast 消息提示弹窗组件
 * 原生实现，无第三方依赖
 *
 * 用法：
 *   Toast.show('保存成功', 'success');          // 默认 3 秒消失
 *   Toast.show('网络错误', 'error', 5000);      // 自定义时长（毫秒）
 *   Toast.show('请注意', 'warning', 0);         // 0 = 不自动关闭，需手动关
 *   Toast.success('操作成功');
 *   Toast.error('发生错误');
 *   Toast.warning('请注意');
 */
(function (global) {
    'use strict';

    // 三种类型的内联 SVG 图标（不依赖任何图标库）
    var ICONS = {
        success: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="12" cy="12" r="10" fill="#22c55e"/>' +
            '<path d="M8 12.5l2.5 2.5L16 9.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="12" cy="12" r="10" fill="#ef4444"/>' +
            '<path d="M9 9l6 6M15 9l-6 6" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<circle cx="12" cy="12" r="10" fill="#f59e0b"/>' +
            '<path d="M12 7v6M12 16v.5" stroke="#fff" stroke-width="2" stroke-linecap="round"/></svg>'
    };

    var DEFAULT_DURATION = 3000;
    var LEAVE_ANIMATION_MS = 300; // 退出动画兜底时长
    var current = null;           // 当前显示中的 toast 实例（同一时间只保留一个）

    /**
     * 显示 toast
     * @param {string} message            消息文本
     * @param {string} [type='success']   类型：success | error | warning
     * @param {number} [duration=3000]    自动关闭时长（毫秒），0 表示不自动关闭
     * @returns {{destroy: Function}}     toast 实例，可手动 destroy()
     */
    function show(message, type, duration) {
        type = type || 'success';
        if (!ICONS[type]) type = 'success';
        duration = (typeof duration === 'number') ? duration : DEFAULT_DURATION;

        // 若已有 toast 在显示，立即替换（避免堆叠）
        if (current) {
            current.destroy(true);
            current = null;
        }

        // ---- 构建 DOM ----
        var overlay = document.createElement('div');
        overlay.className = 'toast-overlay';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-live', 'polite');

        var toast = document.createElement('div');
        toast.className = 'toast toast--' + type;

        var icon = document.createElement('span');
        icon.className = 'toast__icon';
        icon.innerHTML = ICONS[type];

        var msg = document.createElement('span');
        msg.className = 'toast__message';
        // textContent 防止 XSS
        msg.textContent = (message == null) ? '' : String(message);

        var closeBtn = document.createElement('button');
        closeBtn.className = 'toast__close';
        closeBtn.type = 'button';
        closeBtn.setAttribute('aria-label', '关闭');
        closeBtn.textContent = '×';

        toast.appendChild(icon);
        toast.appendChild(msg);
        toast.appendChild(closeBtn);
        overlay.appendChild(toast);
        document.body.appendChild(overlay);

        // ---- 状态与清理 ----
        var timer = null;
        var destroyed = false;
        var instance = null;

        function clearTimer() {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
        }

        function removeFromDOM() {
            if (overlay.parentNode) {
                overlay.parentNode.removeChild(overlay);
            }
            if (current === instance) current = null;
        }

        function destroy(immediate) {
            if (destroyed) return;
            destroyed = true;
            clearTimer();

            if (immediate) {
                // 被新 toast 替换时，立即移除不播动画
                removeFromDOM();
                return;
            }

            // 播放退出动画后移除
            overlay.classList.add('toast-leaving');
            var done = false;
            var onEnd = function () {
                if (done) return;
                done = true;
                overlay.removeEventListener('animationend', onEnd);
                removeFromDOM();
            };
            overlay.addEventListener('animationend', onEnd);
            // 兜底：若 animationend 未触发，确保最终会被移除
            setTimeout(onEnd, LEAVE_ANIMATION_MS);
        }

        instance = { destroy: destroy };

        // ---- 自动关闭 ----
        if (duration > 0) {
            timer = setTimeout(function () { destroy(false); }, duration);
        }

        // ---- 手动关闭 ----
        closeBtn.addEventListener('click', function () { destroy(false); });
        // 点击遮罩空白处也可关闭
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) destroy(false);
        });

        current = instance;
        return instance;
    }

    var Toast = {
        show: show,
        success: function (msg, duration) { return show(msg, 'success', duration); },
        error: function (msg, duration) { return show(msg, 'error', duration); },
        warning: function (msg, duration) { return show(msg, 'warning', duration); }
    };

    global.Toast = Toast;
})(typeof window !== 'undefined' ? window : this);
