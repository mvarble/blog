fn main() {
    let print_u64 = |x: u64| {
        let mask = 1023 << 52;
        let fmask = x | mask;
        let f = f64::from_bits(fmask);
        println!("{x:b}\n{mask:b}\n{fmask:b}\n{f}\n");
    };
    print_u64(0);
    print_u64(0b1111111111111111111111111111111111111111111111111111);
}
