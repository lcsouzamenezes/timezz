interface IValues {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

interface IUpdateEvent extends IValues {
  distance: number;
}

interface IUserSettings {
  date: Date | string | number;
  stop?: boolean;
  canContinue?: boolean;
  beforeCreate?: () => void;
  beforeDestroy?: () => void;
  update?: (event: IUpdateEvent) => void;
}

const TIMEZZ = '[TimezZ]';
const REPOSITORY = 'https://github.com/BrooonS/timezz';

const ONE_SECOND = 1000;
const ONE_MINUTE = ONE_SECOND * 60;
const ONE_HOUR = ONE_MINUTE * 60;
const ONE_DAY = ONE_HOUR * 24;

const values: Array<keyof IValues> = ['days', 'hours', 'minutes', 'seconds'];

class Timezz {
  private timeout!: any;

  private elements!: string | Element | Array<Element>;

  public stop!: boolean;

  public canContinue!: boolean;

  public date!: Date | string | number;

  beforeCreate?: () => void;

  update?: (event: IUpdateEvent) => void;

  constructor(elements: string | Element | Array<Element>, userSettings: IUserSettings) {
    this.elements = elements;
    this.checkFields(userSettings);

    this.date = userSettings.date;
    this.stop = userSettings.stop || false;
    this.canContinue = userSettings.canContinue || false;
    this.beforeCreate = userSettings.beforeCreate;
    this.update = userSettings.update;

    if (typeof this.beforeCreate === 'function') {
      this.beforeCreate();
    }

    this.init();
  }

  private checkFields = (settings: IUserSettings) => {
    const warn = (field: keyof IUserSettings, types: Array<string>) => {
      if (settings[field] !== undefined && types.length) {
        const elements = this.getElements();

        // eslint-disable-next-line no-console
        console.warn(
          `${TIMEZZ}:`,
          `Parameter '${field}' should be ${types.length > 1 ? 'one of the types' : 'the type'}: ${types.join(', ')}.`,
          elements.length > 1 ? elements : elements[0],
        );
      }
    };

    if (
      !(settings.date instanceof Date)
      && typeof settings.date !== 'string'
      && typeof settings.date !== 'number'
    ) {
      warn('date', ['Date', 'string', 'number']);
    }

    if (typeof settings.stop !== 'boolean') {
      warn('stop', ['boolean']);
    }

    if (typeof settings.canContinue !== 'boolean') {
      warn('canContinue', ['boolean']);
    }

    if (typeof settings.beforeCreate !== 'function') {
      warn('beforeCreate', ['function']);
    }

    if (typeof settings.beforeDestroy !== 'function') {
      warn('beforeDestroy', ['function']);
    }

    if (typeof settings.update !== 'function') {
      warn('update', ['function']);
    }
  };

  public init() {
    const countDate = new Date(this.date).getTime();
    const currentTime = new Date().getTime();
    const distance = countDate - currentTime;
    const canContinue = this.canContinue || distance > 0;

    const countDays = canContinue ? this.fixNumber(distance / ONE_DAY) : 0;
    const countHours = canContinue ? this.fixNumber((distance % ONE_DAY) / ONE_HOUR) : 0;
    const countMinutes = canContinue ? this.fixNumber((distance % ONE_HOUR) / ONE_MINUTE) : 0;
    const countSeconds = canContinue ? this.fixNumber((distance % ONE_MINUTE) / ONE_SECOND) : 0;

    const info = {
      days: countDays,
      hours: countHours,
      minutes: countMinutes,
      seconds: countSeconds,
      distance: Math.abs(distance),
    };

    if ((canContinue && !this.stop) || !this.timeout) {
      this.setHTML(info);
    }

    if (typeof this.update === 'function') {
      this.update(info);
    }

    if (!this.timeout) {
      this.timeout = setInterval(this.init.bind(this), ONE_SECOND);
    }
  }

  private fixZero = (number: number) => (number >= 10 ? `${number}` : `0${number}`);

  private fixNumber = (math: number) => Math.floor(Math.abs(math));

  private setHTML(updateInfo: IUpdateEvent) {
    this.getElements().forEach((element) => {
      values.forEach((value: string) => {
        const block = element.querySelector(`[data-${value}]`);
        const number = this.fixZero(updateInfo[value as keyof IValues]);

        if (block && block.innerHTML !== number) {
          block.innerHTML = number;
        }
      });
    });
  }

  private getElements() {
    let elements: Array<Element> = [];

    // For Node.js env
    try {
      if (typeof this.elements === 'string') {
        elements = Array.from(document.querySelectorAll(this.elements));
      } else if (
        (Array.isArray(this.elements) || this.elements instanceof NodeList)
        && Array.from(this.elements).every((element) => element instanceof HTMLElement)
      ) {
        elements = Array.from(this.elements as Array<Element>);
      } else if (this.elements instanceof HTMLElement) {
        elements = [this.elements];
      }
    } catch (e) {
      //
    }

    return elements;
  }

  public destroy() {
    if (this.timeout) {
      clearInterval(this.timeout);
      this.timeout = null;
    }

    this.getElements().forEach((element) => {
      values.forEach((value: string) => {
        const block = element.querySelector(`[data-${value}]`);

        if (block) {
          block.innerHTML = '<!-- -->';
        }
      });
    });
  }
}

const timezz = (
  elements: string | HTMLElement | Array<HTMLElement>,
  userSettings: IUserSettings,
): Timezz => {
  if (elements === undefined) {
    throw new Error(`${TIMEZZ}: Elements isn't passed. Check documentation for more info. ${REPOSITORY}`);
  }

  if (!userSettings || typeof userSettings !== 'object' || Number.isNaN(new Date(userSettings.date).getTime())) {
    throw new Error(`${TIMEZZ}: Date isn't valid. Check documentation for more info. ${REPOSITORY}`);
  }

  return new Timezz(elements, userSettings);
};

timezz.prototype = Timezz.prototype;

export default timezz;
