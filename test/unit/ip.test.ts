import { describe, expect, it } from 'vitest';
import { ipDetector, isValidIpv4, isValidIpv6 } from '../../src/detectors/ip.js';

const values = (text: string) => ipDetector.find(text).map((m) => m.value);

describe('isValidIpv4', () => {
  it('accepts octets 0-255', () => {
    expect(isValidIpv4('192.0.2.10')).toBe(true);
    expect(isValidIpv4('0.0.0.0')).toBe(true);
    expect(isValidIpv4('255.255.255.255')).toBe(true);
  });
  it('rejects out of range, leading zeros and wrong shape', () => {
    expect(isValidIpv4('256.0.0.1')).toBe(false);
    expect(isValidIpv4('192.0.02.1')).toBe(false);
    expect(isValidIpv4('1.2.3')).toBe(false);
  });
});

describe('isValidIpv6', () => {
  it('accepts full, compressed and IPv4-tail forms', () => {
    expect(isValidIpv6('2001:db8:0:0:0:0:0:1')).toBe(true);
    expect(isValidIpv6('2001:db8::1')).toBe(true);
    expect(isValidIpv6('::1')).toBe(true);
    expect(isValidIpv6('2001:db8::')).toBe(true);
    expect(isValidIpv6('::ffff:192.0.2.1')).toBe(true);
  });
  it('rejects two "::", bad groups, wrong counts and times', () => {
    expect(isValidIpv6('2001::db8::1')).toBe(false);
    expect(isValidIpv6('2001:db8::12345')).toBe(false);
    expect(isValidIpv6('1:2:3:4:5:6:7')).toBe(false);
    expect(isValidIpv6('1:2:3:4:5:6:7:8:9')).toBe(false);
    expect(isValidIpv6('12:30:45')).toBe(false);
    expect(isValidIpv6('::')).toBe(false);
    expect(isValidIpv6('::ffff:192.0.2.300')).toBe(false);
    expect(isValidIpv6('2001:db8::1.2.3.4:5')).toBe(false);
  });
});

describe('ipDetector', () => {
  it('keeps port and CIDR suffix outside the match', () => {
    expect(values('10.0.0.1:8080')).toEqual(['10.0.0.1']);
    expect(values('198.51.100.0/24')).toEqual(['198.51.100.0']);
    expect(values('2001:db8::/32')).toEqual(['2001:db8::']);
  });
  it('reports positions', () => {
    expect(ipDetector.find('at 192.0.2.10.')).toEqual([
      { type: 'IP', start: 3, end: 13, value: '192.0.2.10' },
    ]);
  });
  it('reports a mapped address once, not its IPv4 tail again', () => {
    expect(values('::ffff:192.0.2.33 and 203.0.113.5')).toEqual([
      '::ffff:192.0.2.33',
      '203.0.113.5',
    ]);
  });
  it('ignores version numbers, times and dates', () => {
    expect(values('v1.2.3.4 1.2.3.4.5 12:30:45 2026.11.21 std::vector')).toEqual([]);
  });
});
