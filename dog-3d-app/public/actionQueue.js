export class ActionQueue {
  constructor(dogController, callbacks = {}) {
    this.dog = dogController;
    this.callbacks = callbacks;
    this.queue = [];
    this.running = false;
    this.current = null;
    this.cancelled = false;
  }

  replace(commands) {
    this.queue = Array.from(commands);
    this.cancelled = false;
    if (this.running) {
      this.dog.interrupt();
    }
    this.running = false;
    this.current = null;
    this._notifyQueue();
    if (this.queue.length === 0) {
      this._notifyAction('待機中');
      return;
    }
    this._runNext();
  }

  clear() {
    this.queue = [];
    this.cancelled = true;
    this.dog.interrupt();
    this.running = false;
    this.current = null;
    this._notifyQueue();
    this._notifyAction('停止しました');
  }

  async _runNext() {
    if (this.running) return;
    if (this.queue.length === 0) {
      this._notifyAction('完了');
      return;
    }
    this.running = true;
    this.current = this.queue.shift();
    this._notifyQueue();
    this._notifyAction(formatCommand(this.current));
    try {
      await this._execute(this.current);
    } catch (error) {
      console.error('コマンド実行エラー', error);
    }
    this.running = false;
    this.current = null;
    if (!this.cancelled) {
      this._runNext();
    }
  }

  async _execute(command) {
    switch (command.type) {
      case 'move_to':
        return this.dog.moveTo(command.target, command.speed);
      case 'play_animation':
        return this.dog.playAnimation(command.name);
      case 'look_at':
        return this.dog.lookAt(command.target);
      case 'wait':
        return this.dog.wait(command.duration || 1);
      case 'bark':
        return this.dog.bark();
      case 'wag_tail':
        return this.dog.wagTail();
      case 'return_to_user':
        return this.dog.returnToUser();
      default:
        return this.dog.idle();
    }
  }

  _notifyQueue() {
    if (typeof this.callbacks.onQueueUpdate === 'function') {
      this.callbacks.onQueueUpdate({
        queue: this.queue,
        current: this.current,
      });
    }
  }

  _notifyAction(label) {
    if (typeof this.callbacks.onActionUpdate === 'function') {
      this.callbacks.onActionUpdate(label);
    }
  }
}

function formatCommand(command) {
  if (!command) return '待機中';
  switch (command.type) {
    case 'move_to':
      return `移動: ${command.target} (${command.speed || 'walk'})`;
    case 'play_animation':
      return `アニメーション: ${command.name}`;
    case 'look_at':
      return `注視: ${command.target}`;
    case 'wait':
      return `待機: ${command.duration || 1}秒`;
    case 'bark':
      return '吠える';
    case 'wag_tail':
      return 'しっぽを振る';
    case 'return_to_user':
      return 'ユーザーの元へ戻る';
    default:
      return command.type;
  }
}
